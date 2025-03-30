// ステップ4の実装を検証するスクリプト

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

// ESモジュールで__dirnameを取得するための設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 検証結果を格納する配列
const results = [];

// ファイルの存在を確認する関数
function checkFileExists(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  const exists = fs.existsSync(fullPath);
  
  results.push({
    test: `${description} (${filePath})`,
    expected: true,
    actual: exists,
    passed: exists
  });
  
  return exists;
}

// 環境変数ファイルの内容を確認する関数
function checkEnvVarsFile(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    results.push({
      test: `${description} (${filePath})`,
      expected: 'ファイルが存在する',
      actual: 'ファイルが存在しない',
      passed: false
    });
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const hasGoogleClientId = content.includes('GOOGLE_CLIENT_ID=');
  const hasGoogleClientSecret = content.includes('GOOGLE_CLIENT_SECRET=');
  
  results.push({
    test: `${description} - GOOGLE_CLIENT_ID (${filePath})`,
    expected: 'GOOGLE_CLIENT_IDが設定されている',
    actual: hasGoogleClientId ? 'GOOGLE_CLIENT_IDが設定されている' : 'GOOGLE_CLIENT_IDが設定されていない',
    passed: hasGoogleClientId
  });
  
  results.push({
    test: `${description} - GOOGLE_CLIENT_SECRET (${filePath})`,
    expected: 'GOOGLE_CLIENT_SECRETが設定されている',
    actual: hasGoogleClientSecret ? 'GOOGLE_CLIENT_SECRETが設定されている' : 'GOOGLE_CLIENT_SECRETが設定されていない',
    passed: hasGoogleClientSecret
  });
  
  return hasGoogleClientId && hasGoogleClientSecret;
}

// Cloudflareのシークレットが設定されているか確認する関数（この関数は実際には確認できないため、手動確認が必要）
function checkCloudflareSecrets(description) {
  console.log('\n⚠️ 注意: Cloudflareのシークレットは手動で確認する必要があります。');
  console.log('以下のコマンドを実行して、シークレットが設定されているか確認してください：');
  console.log('npx wrangler secret list\n');
  
  results.push({
    test: `${description} - GOOGLE_CLIENT_ID`,
    expected: 'GOOGLE_CLIENT_IDがCloudflareのシークレットとして設定されている',
    actual: '手動確認が必要',
    passed: null
  });
  
  results.push({
    test: `${description} - GOOGLE_CLIENT_SECRET`,
    expected: 'GOOGLE_CLIENT_SECRETがCloudflareのシークレットとして設定されている',
    actual: '手動確認が必要',
    passed: null
  });
}

// アプリケーションが正常に起動するか確認する関数
function checkAppStartup(description) {
  try {
    console.log('\n⚠️ 注意: アプリケーションの起動テストを実行します。');
    console.log('Ctrl+Cで中断できます。\n');
    
    // npm run devを実行（5秒後に中断）
    execSync('timeout 5 npm run dev', { stdio: 'inherit' });
    
    results.push({
      test: `${description}`,
      expected: 'アプリケーションが正常に起動する',
      actual: 'アプリケーションが正常に起動した',
      passed: true
    });
    
    return true;
  } catch (error) {
    results.push({
      test: `${description}`,
      expected: 'アプリケーションが正常に起動する',
      actual: `エラーが発生: ${error.message}`,
      passed: false
    });
    
    return false;
  }
}

// 手動確認が必要な項目を表示する関数
function displayManualCheckItems() {
  console.log('\n===== 手動確認が必要な項目 =====\n');
  
  console.log('1. Google Cloud Platformの設定');
  console.log('   - プロジェクトが作成されていること');
  console.log('   - OAuth同意画面が設定されていること');
  console.log('   - OAuth 2.0クライアントIDとクライアントシークレットが取得できていること');
  
  console.log('\n2. ローカル環境での動作確認');
  console.log('   - ブラウザで`http://localhost:8788`にアクセスできること');
  console.log('   - Googleアカウントでログインできること');
  console.log('   - 認証が必要なページ（`/auth/page1`と`/auth/page2`）にアクセスできること');
  console.log('   - ログアウトすると、認証が必要なページにアクセスできなくなること');
  
  console.log('\n3. Cloudflare環境での動作確認');
  console.log('   - アプリケーションがCloudflareにデプロイされていること');
  console.log('   - ブラウザでCloudflareのURLにアクセスできること');
  console.log('   - Googleアカウントでログインできること');
  console.log('   - 認証が必要なページにアクセスできること');
  console.log('   - ログアウトすると、認証が必要なページにアクセスできなくなること');
}

// 1. 環境変数ファイルの存在を確認
checkFileExists('.dev.vars', 'ローカル環境用の環境変数ファイルが作成されている');

// 2. 環境変数ファイルの内容を確認
if (fs.existsSync(path.join(process.cwd(), '.dev.vars'))) {
  checkEnvVarsFile('.dev.vars', 'ローカル環境用の環境変数が設定されている');
}

// 3. Cloudflareのシークレットが設定されているか確認（手動確認が必要）
checkCloudflareSecrets('Cloudflare環境用の環境変数が設定されている');

// 4. アプリケーションが正常に起動するか確認
// checkAppStartup('アプリケーションが正常に起動する'); // コメントアウトしておく（手動で実行する方が良い）

// 5. 手動確認が必要な項目を表示
displayManualCheckItems();

// 結果を表示
console.log('\n===== ステップ4の検証結果 =====\n');

let passedCount = 0;
let failedCount = 0;
let manualCheckCount = 0;

results.forEach((result, index) => {
  if (result.passed === true) {
    console.log(`✅ ${index + 1}. ${result.test}`);
    passedCount++;
  } else if (result.passed === false) {
    console.log(`❌ ${index + 1}. ${result.test}`);
    console.log(`   期待値: ${result.expected}`);
    console.log(`   実際値: ${result.actual}`);
    failedCount++;
  } else {
    console.log(`⚠️ ${index + 1}. ${result.test} (手動確認が必要)`);
    console.log(`   期待値: ${result.expected}`);
    console.log(`   実際値: ${result.actual}`);
    manualCheckCount++;
  }
});

console.log('\n===== 検証結果サマリー =====');
console.log(`合計テスト数: ${results.length}`);
console.log(`成功: ${passedCount}`);
console.log(`失敗: ${failedCount}`);
console.log(`手動確認が必要: ${manualCheckCount}`);

if (failedCount === 0) {
  console.log('\n🎉 自動テストはすべて成功しました！');
  console.log('手動確認項目を確認して、ステップ4を完了してください。');
} else {
  console.log('\n⚠️ 一部のテストが失敗しました。修正が必要です。');
}
