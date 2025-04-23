// test-api.ts
import { fetch } from 'undici';

// APIのベースURL
const BASE_URL = 'http://localhost:3000';

// 環境変数（実際の環境では.envファイルなどから読み込む）
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// レスポンスの型定義
interface PublicResponse {
  message: string;
  timestamp: string;
}

interface PrivateResponse {
  message: string;
  user: {
    email: string;
    name: string;
  };
  timestamp: string;
}

interface ErrorResponse {
  error: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// 認証なしのエンドポイントをテスト
async function testPublicEndpoint() {
  console.log('=== 認証なしのエンドポイントをテスト ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/public`);
    const data = await response.json() as PublicResponse;
    
    console.log('ステータスコード:', response.status);
    console.log('レスポンス:', data);
    
    if (response.status === 200 && data.message === 'This is a public API endpoint') {
      console.log('✅ テスト成功: 認証なしのエンドポイントにアクセスできました');
    } else {
      console.log('❌ テスト失敗: 認証なしのエンドポイントにアクセスできませんでした');
    }
  } catch (error) {
    console.error('❌ テスト失敗:', error);
  }
  
  console.log('\n');
}

// 認証が必要なエンドポイントを未認証でテスト
async function testPrivateEndpointWithoutAuth() {
  console.log('=== 認証が必要なエンドポイントを未認証でテスト ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/private`);
    const data = await response.json() as ErrorResponse;
    
    console.log('ステータスコード:', response.status);
    console.log('レスポンス:', data);
    
    if (response.status === 401 && data.error === 'Authentication required') {
      console.log('✅ テスト成功: 未認証でアクセスするとエラーになりました');
    } else {
      console.log('❌ テスト失敗: 未認証でもアクセスできてしまいました');
    }
  } catch (error) {
    console.error('❌ テスト失敗:', error);
  }
  
  console.log('\n');
}

// クライアント認証でトークンを取得
async function testClientCredentialsAuth() {
  console.log('=== クライアント認証でトークンを取得 ===');
  
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.log('❌ テスト失敗: 環境変数 GOOGLE_CLIENT_ID と GOOGLE_CLIENT_SECRET が設定されていません');
    console.log('以下のコマンドを実行してください:');
    console.log('export GOOGLE_CLIENT_ID=<your-client-id>');
    console.log('export GOOGLE_CLIENT_SECRET=<your-client-secret>');
    console.log('\n');
    return null;
  }
  
  try {
    const response = await fetch(`${BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: 'client_credentials',
      }),
    });
    
    const data = await response.json() as TokenResponse | ErrorResponse;
    
    console.log('ステータスコード:', response.status);
    console.log('レスポンス:', data);
    
    if (response.status === 200 && 'access_token' in data) {
      console.log('✅ テスト成功: クライアント認証でトークンを取得できました');
      return data.access_token;
    }
    
    console.log('❌ テスト失敗: クライアント認証でトークンを取得できませんでした');
    return null;
  } catch (error) {
    console.error('❌ テスト失敗:', error);
    return null;
  }
}

// 認証が必要なエンドポイントを認証付きでテスト
async function testPrivateEndpointWithAuth(token: string) {
  console.log('=== 認証が必要なエンドポイントを認証付きでテスト ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/private`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json() as PrivateResponse | ErrorResponse;
    
    console.log('ステータスコード:', response.status);
    console.log('レスポンス:', data);
    
    if (response.status === 200 && 'user' in data) {
      console.log('✅ テスト成功: 認証付きでプライベートエンドポイントにアクセスできました');
    } else {
      console.log('❌ テスト失敗: 認証付きでもプライベートエンドポイントにアクセスできませんでした');
    }
  } catch (error) {
    console.error('❌ テスト失敗:', error);
  }
  
  console.log('\n');
}

// メインの実行関数
async function main() {
  console.log('APIエンドポイントのテストを開始します...\n');
  
  // 認証なしのエンドポイントをテスト
  await testPublicEndpoint();
  
  // 認証が必要なエンドポイントを未認証でテスト
  await testPrivateEndpointWithoutAuth();
  
  // クライアント認証でトークンを取得
  const token = await testClientCredentialsAuth();
  
  // トークンが取得できた場合、認証が必要なエンドポイントをテスト
  if (token) {
    await testPrivateEndpointWithAuth(token);
  }
  
  console.log('Google認証のテストについて:');
  console.log('ブラウザベースのGoogle認証は、以下の方法でテストできます:');
  console.log('1. ブラウザで http://localhost:3000/auth/google にアクセスする');
  console.log('2. Googleアカウント（phasetr@gmail.com）でログインする');
  console.log('3. 認証後、/api/private にリダイレクトされ、保護されたデータが表示されることを確認する');
  console.log('4. http://localhost:3000/auth/logout にアクセスしてログアウトする');
  console.log('5. 再度 /api/private にアクセスして、認証エラーが表示されることを確認する');
  
  console.log('\nプログラムによる認証コードフローのテストは、以下のように実装できます:');
  console.log('1. 認証コードを取得するためのリダイレクトURLを生成');
  console.log('2. ユーザーがブラウザでアクセスして認証コードを取得');
  console.log('3. 取得した認証コードを使用して /auth/token エンドポイントからトークンを取得');
  console.log('4. 取得したトークンを使用して /api/private にアクセス');
}

main().catch(console.error);
