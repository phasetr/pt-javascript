// ステップ3の実装を検証するスクリプト

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

// ファイルの内容に特定の文字列が含まれているか確認する関数
function checkFileContains(filePath, searchString, description) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    results.push({
      test: `${description} (${filePath})`,
      expected: `ファイルに "${searchString}" が含まれている`,
      actual: 'ファイルが存在しない',
      passed: false
    });
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const contains = content.includes(searchString);
  
  results.push({
    test: `${description} (${filePath})`,
    expected: `ファイルに "${searchString}" が含まれている`,
    actual: contains ? `ファイルに "${searchString}" が含まれている` : `ファイルに "${searchString}" が含まれていない`,
    passed: contains
  });
  
  return contains;
}

// パッケージがインストールされているか確認
function checkPackageInstalled(packageName, description) {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    results.push({
      test: `${description} (${packageName})`,
      expected: `パッケージがインストールされている`,
      actual: 'package.jsonが存在しない',
      passed: false
    });
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const isInstalled = Object.keys(dependencies).includes(packageName);
  
  results.push({
    test: `${description} (${packageName})`,
    expected: `パッケージがインストールされている`,
    actual: isInstalled ? `パッケージがインストールされている` : `パッケージがインストールされていない`,
    passed: isInstalled
  });
  
  return isInstalled;
}

// 1. 必要なパッケージがインストールされているか確認
checkPackageInstalled('remix-auth', 'remix-authがインストールされている');
checkPackageInstalled('@coji/remix-auth-google', '@coji/remix-auth-googleがインストールされている');
checkPackageInstalled('remix-auth-oauth2', 'remix-auth-oauth2がインストールされている');

// 2. 認証関連のユーティリティファイルが存在するか確認
checkFileExists('app/utils/session.server.ts', 'セッション管理のユーティリティが作成されている');
checkFileExists('app/utils/auth.server.ts', '認証関連のユーティリティが作成されている');

// 3. 認証関連のルートが存在するか確認
checkFileExists('app/routes/auth.google.tsx', 'Google認証を開始するルートが作成されている');
checkFileExists('app/routes/auth.google.callback.tsx', 'Google認証のコールバックを処理するルートが作成されている');

// 4. 各ファイルに必要な要素が含まれているか確認
checkFileContains('app/utils/session.server.ts', 'createCookieSessionStorage', 'セッションストレージの作成が実装されている');
checkFileContains('app/utils/session.server.ts', 'getUserId', 'セッションからユーザーIDを取得する関数が実装されている');
checkFileContains('app/utils/session.server.ts', 'createUserSession', 'ユーザーセッションを作成する関数が実装されている');
checkFileContains('app/utils/session.server.ts', 'logout', 'ログアウト処理が実装されている');

checkFileContains('app/utils/auth.server.ts', 'GoogleStrategy', 'Google認証ストラテジーが実装されている');
checkFileContains('app/utils/auth.server.ts', 'createAuthenticator', '認証インスタンスを作成する関数が実装されている');
checkFileContains('app/utils/auth.server.ts', 'requireUser', '認証が必要なページでのユーザーの要求が実装されている');
checkFileContains('app/utils/auth.server.ts', 'getCurrentUser', '現在のユーザーを取得する関数が実装されている');

checkFileContains('app/routes/auth.google.tsx', 'authenticate', 'Google認証を開始する処理が実装されている');
checkFileContains('app/routes/auth.google.callback.tsx', 'authenticate', 'Google認証のコールバックを処理する処理が実装されている');

checkFileContains('app/routes/login.tsx', '/auth/google', 'ログインページにGoogle認証へのリンクが実装されている');
checkFileContains('app/routes/logout.tsx', 'destroySession', 'ログアウトページにセッション破棄の処理が実装されている');

checkFileContains('app/routes/auth/page1.tsx', 'authenticate', '認証ページ1に認証チェックが実装されている');
checkFileContains('app/routes/auth/page2.tsx', 'authenticate', '認証ページ2に認証チェックが実装されている');

// 5. 環境変数が設定されているか確認
checkFileContains('wrangler.toml', 'SESSION_SECRET', 'セッションの秘密鍵が設定されている');
checkFileContains('wrangler.toml', 'GOOGLE_CALLBACK_URL', 'Google認証のコールバックURLが設定されている');
checkFileContains('wrangler.toml', 'GOOGLE_CLIENT_ID', 'Google OAuth 2.0クライアントIDの設定方法が記述されている');
checkFileContains('wrangler.toml', 'GOOGLE_CLIENT_SECRET', 'Google OAuth 2.0クライアントシークレットの設定方法が記述されている');

// 結果を表示
console.log('\n===== ステップ3の検証結果 =====\n');

let passedCount = 0;
let failedCount = 0;

results.forEach((result, index) => {
  if (result.passed) {
    console.log(`✅ ${index + 1}. ${result.test}`);
    passedCount++;
  } else {
    console.log(`❌ ${index + 1}. ${result.test}`);
    console.log(`   期待値: ${result.expected}`);
    console.log(`   実際値: ${result.actual}`);
    failedCount++;
  }
});

console.log('\n===== 検証結果サマリー =====');
console.log(`合計テスト数: ${results.length}`);
console.log(`成功: ${passedCount}`);
console.log(`失敗: ${failedCount}`);

if (failedCount === 0) {
  console.log('\n🎉 すべてのテストが成功しました！ステップ3は完了です。');
} else {
  console.log('\n⚠️ 一部のテストが失敗しました。修正が必要です。');
}
