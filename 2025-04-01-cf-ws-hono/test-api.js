/**
 * API サーバーのエンドポイントをテストするスクリプト
 * 
 * 使用方法:
 * node test-api.js
 */

const BASE_URL = 'http://localhost:8787';

async function testEndpoint(endpoint, expectedKeys) {
  try {
    console.log(`Testing ${endpoint}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`);

    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Response: ${JSON.stringify(data, null, 2)}`);

    // 期待されるキーが存在するか確認
    if (expectedKeys) {
      const missingKeys = expectedKeys.filter(key => !(key in data));
      if (missingKeys.length > 0) {
        console.error(`❌ Missing expected keys: ${missingKeys.join(', ')}`);
        return false;
      }
      console.log("✅ All expected keys found");
    }

    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('=== API Server Test ===');

  // /health エンドポイントのテスト
  const healthResult = await testEndpoint('/health', ['status', 'timestamp']);

  // /api/info エンドポイントのテスト
  const infoResult = await testEndpoint('/api/info', ['name', 'version', 'description']);

  // 結果のサマリー
  console.log('\n=== Test Summary ===');
  console.log(`/health: ${healthResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`/api/info: ${infoResult ? '✅ PASS' : '❌ FAIL'}`);

  // 全体の結果
  const overallResult = healthResult && infoResult;
  console.log(`\nOverall: ${overallResult ? '✅ PASS' : '❌ FAIL'}`);

  return overallResult;
}

// テストの実行
runTests().then(result => {
  console.log(`\nTests ${result ? 'passed' : 'failed'}`);
  // 終了コードを設定（テスト失敗時は1、成功時は0）
  process.exit(result ? 0 : 1);
});
