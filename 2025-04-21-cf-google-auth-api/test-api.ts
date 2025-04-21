// test-api.ts
import { fetch } from 'undici';

// APIのベースURL
const BASE_URL = 'http://localhost:3000';

// レスポンスの型定義
interface PublicResponse {
  message: string;
  timestamp: string;
}

interface ErrorResponse {
  error: string;
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

// メインの実行関数
async function main() {
  console.log('APIエンドポイントのテストを開始します...\n');
  
  await testPublicEndpoint();
  await testPrivateEndpointWithoutAuth();
  
  console.log('Google認証のテストについて:');
  console.log('Google認証のテストは手動で行う必要があります。以下の手順に従ってください:');
  console.log('1. ブラウザで http://localhost:3000/auth/google にアクセスする');
  console.log('2. Googleアカウント（phasetr@gmail.com）でログインする');
  console.log('3. 認証後、/api/private にリダイレクトされ、保護されたデータが表示されることを確認する');
  console.log('4. http://localhost:3000/auth/logout にアクセスしてログアウトする');
  console.log('5. 再度 /api/private にアクセスして、認証エラーが表示されることを確認する');
}

main().catch(console.error);
