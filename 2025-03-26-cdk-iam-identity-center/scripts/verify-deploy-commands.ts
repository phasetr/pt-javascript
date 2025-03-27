#!/usr/bin/env ts-node
/**
 * デプロイコマンドの検証スクリプト
 * 
 * このスクリプトは、package.jsonに定義されたデプロイコマンドが正しく構成されているかを検証します。
 * 実際のデプロイは行わず、コマンドの構成のみを確認します。
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as child_process from 'node:child_process';

// ルートディレクトリのpackage.jsonを読み込む
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 検証するコマンド
const commandsToVerify = [
  'deploy:dev',
  'deploy:prod',
  'deploy:dev:with-sso',
  'deploy:prod:with-sso',
  'get-sso-info',
  'verify-sso:dev',
  'verify-sso:prod',
  'test-permissions:dev',
  'test-permissions:prod'
];

// 結果を格納する配列
const results: { command: string; exists: boolean; valid: boolean; error?: string }[] = [];

// コマンドの存在と構文を検証
for (const command of commandsToVerify) {
  const result: { command: string; exists: boolean; valid: boolean; error?: string } = { command, exists: false, valid: false };
  
  // コマンドがpackage.jsonに存在するか確認
  if (packageJson.scripts?.[command]) {
    result.exists = true;
    const cmd = packageJson.scripts[command];
    
    try {
      // シェルの構文チェック（実際には実行しない）
      // -n オプションは構文チェックのみを行い、コマンドを実行しない
      child_process.execSync(`bash -n -c "${cmd}"`, { stdio: 'pipe' });
      result.valid = true;
    } catch (error) {
      result.valid = false;
      result.error = error instanceof Error ? error.message : String(error);
    }
  }
  
  results.push(result);
}

// 結果を表示
console.log('デプロイコマンド検証結果:');
console.log('=======================\n');

let allValid = true;

for (const result of results) {
  if (!result.exists) {
    console.log(`❌ ${result.command}: コマンドが定義されていません`);
    allValid = false;
  } else if (!result.valid) {
    console.log(`❌ ${result.command}: 構文エラー - ${result.error}`);
    allValid = false;
  } else {
    console.log(`✅ ${result.command}: 正常`);
  }
}

console.log('\n=======================');
if (allValid) {
  console.log('✅ すべてのデプロイコマンドが正しく構成されています');
} else {
  console.log('❌ 一部のデプロイコマンドに問題があります');
  process.exit(1);
}

// CDKコマンドが利用可能か確認
try {
  const cdkVersion = child_process.execSync('cd packages/CIIC && pnpm cdk --version', { stdio: 'pipe' }).toString().trim();
  console.log(`\nCDK バージョン: ${cdkVersion}`);
} catch (error) {
  console.log('\n❌ CDKコマンドの実行に失敗しました。CDKがインストールされているか確認してください。');
  process.exit(1);
}

// AWS CLIが利用可能か確認
try {
  const awsVersion = child_process.execSync('aws --version', { stdio: 'pipe' }).toString().trim();
  console.log(`AWS CLI: ${awsVersion}`);
} catch (error) {
  console.log('❌ AWS CLIの実行に失敗しました。AWS CLIがインストールされているか確認してください。');
  process.exit(1);
}

console.log('\n検証が完了しました。実際のデプロイを行うには、対応するコマンドを実行してください。');
