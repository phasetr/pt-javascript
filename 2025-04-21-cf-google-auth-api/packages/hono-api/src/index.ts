import { Hono } from "hono";
import type { Context, MiddlewareHandler } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";

// 許可するメールアドレス
const ALLOWED_EMAIL = "phasetr@gmail.com";

// 環境変数の型定義
interface Env {
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	JWT_SECRET: string;
}

// ユーザー情報の型定義
interface UserInfo {
	email: string;
	name: string;
	picture?: string;
}

// JWTペイロードの型定義
interface JWTPayload {
	email: string;
	name: string;
	exp: number;
}

// トークンレスポンスの型定義
interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
}

// クライアント認証リクエストの型定義
interface ClientAuthRequest {
	client_id: string;
	client_secret: string;
	grant_type: string;
	code?: string;
	redirect_uri?: string;
}

// アプリケーションの作成
const app = new Hono<{ Bindings: Env; Variables: { user: UserInfo } }>();

// 認証なしで使えるエンドポイント
app.get("/", (c) => {
	return c.json({
		message: "This is the root endpoint",
		timestamp: new Date().toISOString(),
	});
});

// 認証なしで使えるエンドポイント
app.get("/api/public", (c) => {
	return c.json({
		message: "This is a public API endpoint",
		timestamp: new Date().toISOString(),
	});
});

// Google認証ルート
app.get("/auth/google", async (c) => {
	const clientId = c.env.GOOGLE_CLIENT_ID;
	const redirectUri = `${new URL(c.req.url).origin}/auth/google/callback`;
	const scope = "email profile";

	const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
	authUrl.searchParams.set("client_id", clientId);
	authUrl.searchParams.set("redirect_uri", redirectUri);
	authUrl.searchParams.set("response_type", "code");
	authUrl.searchParams.set("scope", scope);

	return c.redirect(authUrl.toString());
});

// Google認証コールバック
app.get("/auth/google/callback", async (c) => {
	const code = c.req.query("code");

	if (!code) {
		return c.json({ error: "Authorization code not found" }, 400);
	}

	// トークンの取得
	const clientId = c.env.GOOGLE_CLIENT_ID;
	const clientSecret = c.env.GOOGLE_CLIENT_SECRET;
	const redirectUri = `${new URL(c.req.url).origin}/auth/google/callback`;

	const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			code,
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: redirectUri,
			grant_type: "authorization_code",
		}),
	});

	const tokens = (await tokenResponse.json()) as { access_token?: string };

	if (!tokens.access_token) {
		return c.json({ error: "Failed to get access token" }, 400);
	}

	// ユーザー情報の取得
	const userInfoResponse = await fetch(
		"https://www.googleapis.com/oauth2/v2/userinfo",
		{
			headers: {
				Authorization: `Bearer ${tokens.access_token}`,
			},
		},
	);

	const userInfo = (await userInfoResponse.json()) as UserInfo;

	// 許可されたメールアドレスかチェック
	if (userInfo.email !== ALLOWED_EMAIL) {
		return c.json({ error: "Unauthorized email" }, 403);
	}

	// JWTトークンの生成
	const payload: JWTPayload = {
		email: userInfo.email,
		name: userInfo.name,
		exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24時間有効
	};

	const jwtToken = await generateJWT(c, payload);

	// Cookieにトークンを保存
	setCookie(c, "auth_token", jwtToken, {
		httpOnly: true,
		secure: true,
		path: "/",
		maxAge: 60 * 60 * 24, // 24時間
	});

	// 認証成功後のリダイレクト
	return c.redirect("/api/private");
});

// JWTトークンの生成関数
async function generateJWT<T extends { Bindings: Env }>(
	c: Context<T>,
	payload: JWTPayload,
): Promise<string> {
	const jwtSecret = c.env.JWT_SECRET;

	// JWTトークンの署名
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(jwtSecret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	const signature = await crypto.subtle.sign(
		{ name: "HMAC" },
		key,
		encoder.encode(JSON.stringify(payload)),
	);

	const base64Payload = btoa(JSON.stringify(payload));
	const base64Signature = btoa(
		String.fromCharCode(...new Uint8Array(signature)),
	);
	return `${base64Payload}.${base64Signature}`;
}

// JWTトークンの検証関数
async function verifyJWTToken<T extends { Bindings: Env }>(
	c: Context<T>,
	token: string,
): Promise<JWTPayload> {
	try {
		// トークンの検証
		const [payloadBase64] = token.split(".");
		const payload = JSON.parse(atob(payloadBase64)) as JWTPayload;

		// 有効期限のチェック
		if (payload.exp < Math.floor(Date.now() / 1000)) {
			throw new HTTPException(401, { message: "Token expired" });
		}

		// メールアドレスのチェック
		if (payload.email !== ALLOWED_EMAIL) {
			throw new HTTPException(403, { message: "Unauthorized email" });
		}

		return payload;
	} catch (e) {
		if (e instanceof HTTPException) {
			throw e;
		}
		throw new HTTPException(401, { message: "Invalid token" });
	}
}

// JWTミドルウェア
const verifyJWT: MiddlewareHandler<{
	Bindings: Env;
	Variables: { user: UserInfo };
}> = async (c, next) => {
	// Cookieからトークンを取得
	let token = getCookie(c, "auth_token");

	// Authorization headerからトークンを取得（Cookieより優先）
	const authHeader = c.req.header("Authorization");
	if (authHeader?.startsWith("Bearer ")) {
		token = authHeader.substring(7);
	}

	if (!token) {
		return c.json({ error: "Authentication required" }, 401);
	}

	try {
		const payload = await verifyJWTToken(c, token);

		// ユーザー情報をコンテキストに追加
		c.set("user", {
			email: payload.email,
			name: payload.name,
		});

		await next();
	} catch (e) {
		if (e instanceof HTTPException) {
			return c.json({ error: e.message }, e.status);
		}
		return c.json({ error: "Invalid token" }, 401);
	}
};

// 認証が必要なエンドポイント
app.get("/api/private", verifyJWT, (c) => {
	const user = c.get("user");

	return c.json({
		message: "This is a protected API endpoint",
		user: {
			email: user.email,
			name: user.name,
		},
		timestamp: new Date().toISOString(),
	});
});

// クライアント認証用のトークン取得エンドポイント
app.post("/auth/token", async (c) => {
	// リクエストボディの取得
	const body = (await c.req.json()) as ClientAuthRequest;

	// クライアントIDとシークレットの検証
	if (
		body.client_id !== c.env.GOOGLE_CLIENT_ID ||
		body.client_secret !== c.env.GOOGLE_CLIENT_SECRET
	) {
		return c.json({ error: "Invalid client credentials" }, 401);
	}

	// 認証コードによる認証
	if (
		body.grant_type === "authorization_code" &&
		body.code &&
		body.redirect_uri
	) {
		// Googleからトークンを取得
		const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				code: body.code,
				client_id: body.client_id,
				client_secret: body.client_secret,
				redirect_uri: body.redirect_uri,
				grant_type: "authorization_code",
			}),
		});

		const tokens = (await tokenResponse.json()) as { access_token?: string };

		if (!tokens.access_token) {
			return c.json({ error: "Failed to get access token" }, 400);
		}

		// ユーザー情報の取得
		const userInfoResponse = await fetch(
			"https://www.googleapis.com/oauth2/v2/userinfo",
			{
				headers: {
					Authorization: `Bearer ${tokens.access_token}`,
				},
			},
		);

		const userInfo = (await userInfoResponse.json()) as UserInfo;

		// 許可されたメールアドレスかチェック
		if (userInfo.email !== ALLOWED_EMAIL) {
			return c.json({ error: "Unauthorized email" }, 403);
		}

		// JWTトークンの生成
		const payload: JWTPayload = {
			email: userInfo.email,
			name: userInfo.name,
			exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24時間有効
		};

		const jwtToken = await generateJWT(c, payload);

		// トークンレスポンスの返却
		return c.json({
			access_token: jwtToken,
			token_type: "Bearer",
			expires_in: 60 * 60 * 24, // 24時間
		} as TokenResponse);
	}

	// クライアント認証（client_credentials）
	if (body.grant_type === "client_credentials") {
		// 固定のユーザー情報を使用（実際のアプリケーションでは適切な認証が必要）
		const payload: JWTPayload = {
			email: ALLOWED_EMAIL,
			name: "API Client",
			exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1時間有効
		};

		const jwtToken = await generateJWT(c, payload);

		// トークンレスポンスの返却
		return c.json({
			access_token: jwtToken,
			token_type: "Bearer",
			expires_in: 60 * 60, // 1時間
		} as TokenResponse);
	}

	return c.json({ error: "Unsupported grant type" }, 400);
});

// ログアウトエンドポイント
app.get("/auth/logout", (c) => {
	setCookie(c, "auth_token", "", {
		httpOnly: true,
		secure: true,
		path: "/",
		maxAge: 0,
	});

	return c.redirect("/api/public");
});

// Cloudflare Workersのハンドラー
export default {
	fetch: app.fetch,
};
