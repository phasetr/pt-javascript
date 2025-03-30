import { Authenticator } from "remix-auth";
import { GoogleStrategy, type GoogleProfile } from "@coji/remix-auth-google";
import { createCloudflareSessionStorage } from "./session.server";
import type { SessionStorage } from "@remix-run/cloudflare";

// ユーザーモデルの定義
export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

// 認証インスタンスの作成
export function createAuthenticator(env: Record<string, string>, sessionStorage: SessionStorage) {
  const authenticator = new Authenticator<User>(sessionStorage);

  // Google認証ストラテジーの設定
  const googleStrategy = new GoogleStrategy<User>(
    {
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
      redirectURI: env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback",
      scopes: ["openid", "email", "profile"],
    },
    async ({ profile }) => {
      // Googleプロファイルからユーザー情報を取得
      const googleProfile = profile as GoogleProfile;
      const user: User = {
        id: googleProfile.id,
        email: googleProfile.emails[0].value,
        name: googleProfile.displayName,
        avatarUrl: googleProfile.photos?.[0]?.value,
      };
      
      // 実際のアプリケーションでは、ここでユーザーをデータベースに保存または更新する
      // 例: await saveUserToDatabase(user);
      
      return user;
    }
  );

  // Google認証ストラテジーを登録
  authenticator.use(googleStrategy);

  return authenticator;
}

// ユーザーがログインしているか確認するミドルウェア
export async function requireUser(request: Request, authenticator: Authenticator<User>) {
  try {
    // authenticateメソッドを使用して認証を試みる
    // 第一引数はストラテジー名、デフォルトは "google"
    const user = await authenticator.authenticate("google", request);
    return user;
  } catch (error) {
    // 認証に失敗した場合はログインページにリダイレクト
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw new Response(null, {
      status: 302,
      headers: {
        Location: `/login?${searchParams}`,
      },
    });
  }
}

// 現在のユーザーを取得する関数
export async function getCurrentUser(request: Request, authenticator: Authenticator<User>) {
  try {
    return await authenticator.authenticate("google", request);
  } catch (error) {
    return null;
  }
}
