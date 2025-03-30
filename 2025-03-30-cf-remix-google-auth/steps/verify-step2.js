// ステップ2の実装を検証するスクリプト
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

// 1. 必要なファイルが存在するか確認
checkFileExists('app/routes/auth/page1.tsx', '認証ページ1が作成されている');
checkFileExists('app/routes/auth/page2.tsx', '認証ページ2が作成されている');
checkFileExists('app/routes/login.tsx', 'ログインページが作成されている');
checkFileExists('app/routes/logout.tsx', 'ログアウトページが作成されている');

// 2. 各ファイルに必要な要素が含まれているか確認
checkFileContains('app/root.tsx', '<Link', 'ナビゲーションリンクが実装されている');
checkFileContains('app/root.tsx', 'ログイン', 'ログインリンクが実装されている');
checkFileContains('app/root.tsx', 'ログアウト', 'ログアウトリンクが実装されている');

checkFileContains('app/routes/_index.tsx', 'Form', 'メインページにフォームが実装されている');
checkFileContains('app/routes/_index.tsx', 'Googleでログイン', 'Googleログインボタンが実装されている');

checkFileContains('app/routes/login.tsx', 'Form', 'ログインページにフォームが実装されている');
checkFileContains('app/routes/login.tsx', 'action', 'ログインページにactionが実装されている');
checkFileContains('app/routes/login.tsx', 'Googleでログイン', 'Googleログインボタンが実装されている');

checkFileContains('app/routes/auth/page1.tsx', 'loader', '認証ページ1にloaderが実装されている');
checkFileContains('app/routes/auth/page1.tsx', 'useLoaderData', '認証ページ1でloaderデータを使用している');

checkFileContains('app/routes/auth/page2.tsx', 'loader', '認証ページ2にloaderが実装されている');
checkFileContains('app/routes/auth/page2.tsx', 'useLoaderData', '認証ページ2でloaderデータを使用している');

checkFileContains('app/routes/logout.tsx', 'action', 'ログアウトページにactionが実装されている');
checkFileContains('app/routes/logout.tsx', 'redirect', 'ログアウトページでリダイレクトを行っている');

// 結果を表示
console.log('\n===== ステップ2の検証結果 =====\n');

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
  console.log('\n🎉 すべてのテストが成功しました！ステップ2は完了です。');
} else {
  console.log('\n⚠️ 一部のテストが失敗しました。修正が必要です。');
}
