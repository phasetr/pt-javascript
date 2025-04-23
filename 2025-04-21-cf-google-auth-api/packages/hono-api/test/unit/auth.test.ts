import { TextEncoder } from "node:util";
import { describe, expect, it, vi, beforeAll, afterAll } from "vitest";
import app from "../../src/index";

// JWTペイロードの型定義
interface JWTPayload {
	email: string;
	name: string;
	exp: number;
}

// モック環境変数
const mockEnv = {
	GOOGLE_CLIENT_ID: "mock-client-id",
	GOOGLE_CLIENT_SECRET: "mock-client-secret",
	JWT_SECRET: "mock-jwt-secret",
};

// JWTトークン生成用の関数
async function generateTestJWT(
	secret: string,
	payload: JWTPayload,
): Promise<string> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
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

describe("認証関連の単体テスト", () => {
	// テスト用のトークン
	let validToken: string;
	let expiredToken: string;
	const invalidToken = "invalid.token";
	const jwtSecret = mockEnv.JWT_SECRET;

	// 外部APIのモック
	const originalFetch = global.fetch;

	beforeAll(async () => {
		// fetchのモック化
		global.fetch = vi.fn();

		// モックレスポンスの設定
		(global.fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation((url: string, options: RequestInit) => {
			// Google OAuth トークンエンドポイントのモック
			if (url === "https://oauth2.googleapis.com/token") {
				return Promise.resolve({
					json: () =>
						Promise.resolve({
							access_token: "mock-google-access-token",
							token_type: "Bearer",
							expires_in: 3600,
						}),
				});
			}

			// Google ユーザー情報エンドポイントのモック
			if (url === "https://www.googleapis.com/oauth2/v2/userinfo") {
				return Promise.resolve({
					json: () =>
						Promise.resolve({
							email: "phasetr@gmail.com",
							name: "Test User",
							picture: "https://example.com/picture.jpg",
						}),
				});
			}

			// その他のリクエストは失敗させる
			return Promise.reject(new Error(`Unhandled fetch request: ${url}`));
		});

		// 有効なトークンを生成
		const validPayload = {
			email: "phasetr@gmail.com", // 許可されたメールアドレス
			name: "Test User",
			exp: Math.floor(Date.now() / 1000) + 3600, // 1時間有効
		};
		validToken = await generateTestJWT(jwtSecret, validPayload);

		// 期限切れトークンを生成
		const expiredPayload = {
			email: "phasetr@gmail.com",
			name: "Test User",
			exp: Math.floor(Date.now() / 1000) - 3600, // 1時間前に期限切れ
		};
		expiredToken = await generateTestJWT(jwtSecret, expiredPayload);
	});

	afterAll(() => {
		// モックをリセット
		global.fetch = originalFetch;
	});

	describe("パブリックエンドポイント", () => {
		it("認証なしで / にアクセスできること", async () => {
			// リクエストの作成
			const req = new Request("http://localhost/");
			
			// アプリケーションにリクエストを送信
			const res = await app.fetch(req, mockEnv);
			
			// レスポンスの検証
			expect(res.status).toBe(200);
			
			const data = await res.json() as { message: string; timestamp: string };
			expect(data).toHaveProperty("message");
			expect(data.message).toBe("This is the root endpoint");
		});

		it("認証なしで /api/public にアクセスできること", async () => {
			const req = new Request("http://localhost/api/public");
			const res = await app.fetch(req, mockEnv);
			
			expect(res.status).toBe(200);
			
			const data = await res.json() as { message: string; timestamp: string };
			expect(data).toHaveProperty("message");
			expect(data.message).toBe("This is a public API endpoint");
		});
	});

	describe("プライベートエンドポイント", () => {
		it("認証なしで /api/private にアクセスすると401エラーになること", async () => {
			const req = new Request("http://localhost/api/private");
			const res = await app.fetch(req, mockEnv);
			
			expect(res.status).toBe(401);
			
			const data = await res.json() as { error: string };
			expect(data).toHaveProperty("error");
			expect(data.error).toBe("Authentication required");
		});

		it("無効なトークンで /api/private にアクセスすると401エラーになること", async () => {
			const req = new Request("http://localhost/api/private", {
				headers: {
					Authorization: `Bearer ${invalidToken}`,
				},
			});
			const res = await app.fetch(req, mockEnv);
			
			expect(res.status).toBe(401);
			
			const data = await res.json() as { error: string };
			expect(data).toHaveProperty("error");
		});

		it("期限切れトークンで /api/private にアクセスすると401エラーになること", async () => {
			const req = new Request("http://localhost/api/private", {
				headers: {
					Authorization: `Bearer ${expiredToken}`,
				},
			});
			const res = await app.fetch(req, mockEnv);
			
			expect(res.status).toBe(401);
			
			const data = await res.json() as { error: string };
			expect(data).toHaveProperty("error");
			expect(data.error).toBe("Token expired");
		});

		it("有効なトークンで /api/private にアクセスできること（Authorizationヘッダー使用）", async () => {
			const req = new Request("http://localhost/api/private", {
				headers: {
					Authorization: `Bearer ${validToken}`,
				},
			});
			const res = await app.fetch(req, mockEnv);
			
			expect(res.status).toBe(200);
			
			const data = await res.json() as { message: string; user: { email: string; name: string }; timestamp: string };
			expect(data).toHaveProperty("message");
			expect(data.message).toBe("This is a protected API endpoint");
			expect(data).toHaveProperty("user");
			expect(data.user).toHaveProperty("email", "phasetr@gmail.com");
		});

		it("有効なトークンで /api/private にアクセスできること（Cookie使用）", async () => {
			const req = new Request("http://localhost/api/private", {
				headers: {
					Cookie: `auth_token=${validToken}`,
				},
			});
			const res = await app.fetch(req, mockEnv);
			
			expect(res.status).toBe(200);
			
			const data = await res.json() as { message: string; user: { email: string; name: string }; timestamp: string };
			expect(data).toHaveProperty("message");
			expect(data.message).toBe("This is a protected API endpoint");
			expect(data).toHaveProperty("user");
			expect(data.user).toHaveProperty("email", "phasetr@gmail.com");
		});
	});

	describe("認証トークンエンドポイント", () => {
		it("クライアント認証（client_credentials）でトークンを取得できること", async () => {
			const req = new Request("http://localhost/auth/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					client_id: mockEnv.GOOGLE_CLIENT_ID,
					client_secret: mockEnv.GOOGLE_CLIENT_SECRET,
					grant_type: "client_credentials",
				}),
			});
			const res = await app.fetch(req, mockEnv);
			
			expect(res.status).toBe(200);
			
			const data = await res.json() as { access_token: string; token_type: string; expires_in: number };
			expect(data).toHaveProperty("access_token");
			expect(data).toHaveProperty("token_type", "Bearer");
			expect(data).toHaveProperty("expires_in");
		});

		it("無効なクライアント認証情報でトークン取得に失敗すること", async () => {
			const req = new Request("http://localhost/auth/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					client_id: "invalid-client-id",
					client_secret: "invalid-client-secret",
					grant_type: "client_credentials",
				}),
			});
			const res = await app.fetch(req, mockEnv);
			
			expect(res.status).toBe(401);
			
			const data = await res.json() as { error: string };
			expect(data).toHaveProperty("error", "Invalid client credentials");
		});
	});

	describe("Google認証フロー", () => {
		it("Google認証エンドポイントにアクセスするとリダイレクトされること", async () => {
			const req = new Request("http://localhost/auth/google");
			const res = await app.fetch(req, mockEnv);
			
			expect(res.status).toBe(302); // リダイレクト
			
			const location = res.headers.get("Location");
			expect(location).toContain("https://accounts.google.com/o/oauth2/v2/auth");
			expect(location).toContain(`client_id=${mockEnv.GOOGLE_CLIENT_ID}`);
			expect(location).toContain("redirect_uri=");
			expect(location).toContain("response_type=code");
			expect(location).toContain("scope=email+profile");
		});

		it("Google認証コールバックが正常に処理されること", async () => {
			const req = new Request("http://localhost/auth/google/callback?code=mock-auth-code");
			const res = await app.fetch(req, mockEnv);
			
			expect(res.status).toBe(302); // リダイレクト
			
			const location = res.headers.get("Location");
			expect(location).toBe("/api/private");
			
			// Cookieの設定を確認
			const setCookie = res.headers.get("Set-Cookie");
			expect(setCookie).toBeDefined();
			expect(setCookie).toContain("auth_token=");
			expect(setCookie).toContain("HttpOnly");
			expect(setCookie).toContain("Secure");
		});

		it("認証コードなしでGoogle認証コールバックにアクセスするとエラーになること", async () => {
			const req = new Request("http://localhost/auth/google/callback");
			const res = await app.fetch(req, mockEnv);
			
			expect(res.status).toBe(400);
			
			const data = await res.json() as { error: string };
			expect(data).toHaveProperty("error", "Authorization code not found");
		});
	});

	describe("ログアウト", () => {
		it("ログアウトエンドポイントにアクセスするとリダイレクトされ、Cookieが削除されること", async () => {
			const req = new Request("http://localhost/auth/logout");
			const res = await app.fetch(req, mockEnv);
			
			expect(res.status).toBe(302); // リダイレクト
			
			const location = res.headers.get("Location");
			expect(location).toBe("/api/public");
			
			// Cookieの設定を確認
			const setCookie = res.headers.get("Set-Cookie");
			expect(setCookie).toBeDefined();
			expect(setCookie).toContain("auth_token=");
			expect(setCookie).toContain("Max-Age=0");
			expect(setCookie).toContain("HttpOnly");
			expect(setCookie).toContain("Secure");
		});
	});
});
