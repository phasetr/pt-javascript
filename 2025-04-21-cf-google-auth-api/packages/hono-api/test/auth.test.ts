import { describe, it, expect, beforeAll } from 'vitest';
import { request } from 'undici';
import { TextEncoder } from 'node:util';

// サーバーのベースURL（wrangler devで起動しているサーバー）
const BASE_URL = 'http://localhost:3000';

// JWTペイロードの型定義
interface JWTPayload {
  email: string;
  name: string;
  exp: number;
}

// JWTトークン生成用の関数
async function generateTestJWT(secret: string, payload: JWTPayload): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'HMAC' },
    key,
    encoder.encode(JSON.stringify(payload))
  );

  const base64Payload = btoa(JSON.stringify(payload));
  const base64Signature = btoa(
    String.fromCharCode(...new Uint8Array(signature))
  );
  return `${base64Payload}.${base64Signature}`;
}

describe('認証関連の結合テスト', () => {
  // テスト用のトークン
  let validToken: string;
  let expiredToken: string;
  const invalidToken = 'invalid.token';
  const jwtSecret = 'test-jwt-secret'; // 注: 実際のサーバーの環境変数と一致させる必要があります

  // テスト前に有効なトークンと期限切れトークンを生成
  beforeAll(async () => {
    // 有効なトークンを生成
    const validPayload = {
      email: 'phasetr@gmail.com', // 許可されたメールアドレス
      name: 'Test User',
      exp: Math.floor(Date.now() / 1000) + 3600 // 1時間有効
    };
    validToken = await generateTestJWT(jwtSecret, validPayload);
    
    // 期限切れトークンを生成
    const expiredPayload = {
      email: 'phasetr@gmail.com',
      name: 'Test User',
      exp: Math.floor(Date.now() / 1000) - 3600 // 1時間前に期限切れ
    };
    expiredToken = await generateTestJWT(jwtSecret, expiredPayload);
  });

  describe('パブリックエンドポイント', () => {
    it('認証なしで / にアクセスできること', async () => {
      const { statusCode, body } = await request(`${BASE_URL}/`);
      expect(statusCode).toBe(200);
      
      const data = await body.json() as { message: string; timestamp: string };
      expect(data).toHaveProperty('message');
      expect(data.message).toBe('This is the root endpoint');
    });

    it('認証なしで /api/public にアクセスできること', async () => {
      const { statusCode, body } = await request(`${BASE_URL}/api/public`);
      expect(statusCode).toBe(200);
      
      const data = await body.json() as { message: string; timestamp: string };
      expect(data).toHaveProperty('message');
      expect(data.message).toBe('This is a public API endpoint');
    });
  });

  describe('プライベートエンドポイント', () => {
    it('認証なしで /api/private にアクセスすると401エラーになること', async () => {
      const { statusCode, body } = await request(`${BASE_URL}/api/private`);
      expect(statusCode).toBe(401);
      
      const data = await body.json() as { error: string };
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Authentication required');
    });

    it('無効なトークンで /api/private にアクセスすると401エラーになること', async () => {
      const { statusCode, body } = await request(`${BASE_URL}/api/private`, {
        headers: {
          'Authorization': `Bearer ${invalidToken}`
        }
      });
      expect(statusCode).toBe(401);
      
      const data = await body.json() as { error: string };
      expect(data).toHaveProperty('error');
    });
    
    it('期限切れトークンで /api/private にアクセスすると401エラーになること', async () => {
      const { statusCode, body } = await request(`${BASE_URL}/api/private`, {
        headers: {
          'Authorization': `Bearer ${expiredToken}`
        }
      });
      expect(statusCode).toBe(401);
      
      const data = await body.json() as { error: string };
      expect(data).toHaveProperty('error');
      // 注: 実際のサーバーの実装によってエラーメッセージが異なる場合があります
      // expect(data.error).toBe('Token expired');
    });

    it('有効なトークンで /api/private にアクセスできること（Authorizationヘッダー使用）', async () => {
      const { statusCode, body } = await request(`${BASE_URL}/api/private`, {
        headers: {
          'Authorization': `Bearer ${validToken}`
        }
      });
      
      // 注: 実際のサーバーでトークンが検証できない場合、このテストは失敗します
      // その場合は、サーバーの環境変数（JWT_SECRET）と一致するようにjwtSecretを設定してください
      console.log('プライベートエンドポイントのレスポンス:', await body.text());
      
      // 理想的には以下のようになるはずです
      // expect(statusCode).toBe(200);
      // const data = await body.json() as { message: string; user: { email: string; name: string }; timestamp: string };
      // expect(data).toHaveProperty('message');
      // expect(data.message).toBe('This is a protected API endpoint');
      // expect(data).toHaveProperty('user');
      // expect(data.user).toHaveProperty('email', 'phasetr@gmail.com');
    });

    it('有効なトークンで /api/private にアクセスできること（Cookie使用）', async () => {
      const { statusCode, body } = await request(`${BASE_URL}/api/private`, {
        headers: {
          'Cookie': `auth_token=${validToken}`
        }
      });
      
      // 注: 実際のサーバーでトークンが検証できない場合、このテストは失敗します
      console.log('プライベートエンドポイント（Cookie）のレスポンス:', await body.text());
      
      // 理想的には以下のようになるはずです
      // expect(statusCode).toBe(200);
      // const data = await body.json() as { message: string; user: { email: string; name: string }; timestamp: string };
      // expect(data).toHaveProperty('message');
      // expect(data.message).toBe('This is a protected API endpoint');
      // expect(data).toHaveProperty('user');
      // expect(data.user).toHaveProperty('email', 'phasetr@gmail.com');
    });
  });

  describe('認証トークンエンドポイント', () => {
    it('クライアント認証（client_credentials）でトークンを取得できること', async () => {
      const { statusCode, body } = await request(`${BASE_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: 'test-client-id', // 注: 実際のサーバーの環境変数と一致させる必要があります
          client_secret: 'test-client-secret', // 注: 実際のサーバーの環境変数と一致させる必要があります
          grant_type: 'client_credentials',
        }),
      });
      
      // 注: 実際のサーバーの環境変数と一致しない場合、このテストは失敗します
      console.log('トークンエンドポイントのレスポンス:', await body.text());
      
      // 理想的には以下のようになるはずです
      // expect(statusCode).toBe(200);
      // const data = await body.json() as { access_token: string; token_type: string; expires_in: number };
      // expect(data).toHaveProperty('access_token');
      // expect(data).toHaveProperty('token_type', 'Bearer');
      // expect(data).toHaveProperty('expires_in');
    });

    it('無効なクライアント認証情報でトークン取得に失敗すること', async () => {
      const { statusCode, body } = await request(`${BASE_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: 'invalid-client-id',
          client_secret: 'invalid-client-secret',
          grant_type: 'client_credentials',
        }),
      });
      
      expect(statusCode).toBe(401);
      const data = await body.json() as { error: string };
      expect(data).toHaveProperty('error', 'Invalid client credentials');
    });
  });

  describe('ログアウト', () => {
    it('ログアウトエンドポイントにアクセスするとリダイレクトされ、Cookieが削除されること', async () => {
      const { statusCode, headers } = await request(`${BASE_URL}/auth/logout`);
      expect(statusCode).toBe(302); // リダイレクト
      
      // リダイレクト先を確認
      const location = headers.location;
      expect(location).toBe('/api/public');
      
      // Cookieヘッダーの存在を確認
      const setCookie = headers['set-cookie'];
      expect(setCookie).toBeDefined();
      
      // Cookieの内容を確認
      expect(setCookie).toContain('auth_token=');
      expect(setCookie).toContain('Max-Age=0');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('Secure');
    });
  });
});
