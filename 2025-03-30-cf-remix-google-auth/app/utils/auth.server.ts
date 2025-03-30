import { Authenticator } from "remix-auth";
import { GoogleStrategy, type GoogleProfile } from "@coji/remix-auth-google";
import type { SessionStorage } from "@remix-run/cloudflare";

// ユーザーモデルの定義
export type User = {
	id: string;
	email: string;
	name: string;
	avatarUrl?: string;
};

// 認証インスタンスの作成
export function createAuthenticator(
	sessionStorage: SessionStorage,
	env?: Record<string, string>,
) {
	const authenticator = new Authenticator<User>(sessionStorage);
	console.log("CLIENT_ID:", env?.GOOGLE_CLIENT_ID);
	console.log("CLIENT_SECRET:", env?.GOOGLE_CLIENT_SECRET);
	console.log("CALLBACK_URL:", env?.GOOGLE_CALLBACK_URL);

	// Google認証ストラテジーの設定
	const googleStrategy = new GoogleStrategy<User>(
		{
			clientId: env?.GOOGLE_CLIENT_ID || "",
			clientSecret: env?.GOOGLE_CLIENT_SECRET || "",
			redirectURI: env?.GOOGLE_CALLBACK_URL || "http://google.com",
			scopes: ["openid", "email", "profile"],
		},
		async ({ tokens }) => {
			try {
				// GoogleStrategyのstaticメソッドを使用してプロファイルを取得
				const profile = await GoogleStrategy.userProfile(tokens);

				if (!profile || !profile.id) {
					throw new Error("プロファイルが不完全です");
				}

				const user: User = {
					id: profile.id,
					email: profile.emails[0].value,
					name: profile.displayName,
					avatarUrl: profile.photos?.[0]?.value,
				};

				// 実際のアプリケーションでは、ここでユーザーをデータベースに保存または更新する
				// 例: await saveUserToDatabase(user);

				return user;
			} catch (error) {
				console.error("Google認証プロファイル処理エラー:", error);
				throw error;
			}
		},
	);

	// Google認証ストラテジーを登録
	authenticator.use(googleStrategy);

	return authenticator;
}

// ユーザーがログインしているか確認するミドルウェア
export async function requireUser(
	request: Request,
	sessionStorage: SessionStorage,
) {
	const session = await getSession(request, sessionStorage);
	const userId = session.get("userId");

	if (!userId) {
		// 認証されていない場合はログインページにリダイレクト
		const url = new URL(request.url);
		const redirectTo = url.pathname + url.search;
		const searchParams = new URLSearchParams([
			["redirectTo", redirectTo],
			["error", "認証が必要です。ログインしてください。"],
		]);
		throw new Response(null, {
			status: 302,
			headers: {
				Location: `/login?${searchParams}`,
			},
		});
	}

	// ユーザーIDがある場合は、ダミーのユーザー情報を返す
	// 実際のアプリケーションでは、ユーザーIDを使用してデータベースからユーザー情報を取得する
	const user: User = {
		id: userId,
		name: "認証済みユーザー",
		email: "user@example.com",
		avatarUrl:
			"https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff",
	};

	return user;
}

// 現在のユーザーを取得する関数
export async function getCurrentUser(
	request: Request,
	sessionStorage: SessionStorage,
): Promise<User | null> {
	const session = await getSession(request, sessionStorage);
	const userId = session.get("userId");

	if (!userId) {
		return null;
	}

	// ユーザーIDがある場合は、ダミーのユーザー情報を返す
	// 実際のアプリケーションでは、ユーザーIDを使用してデータベースからユーザー情報を取得する
	const user: User = {
		id: userId,
		name: "認証済みユーザー",
		email: "user@example.com",
		avatarUrl:
			"https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff",
	};

	return user;
}

// セッションからユーザーIDを取得する関数
async function getSession(request: Request, sessionStorage: SessionStorage) {
	const cookie = request.headers.get("Cookie");
	return sessionStorage.getSession(cookie);
}
