#!/usr/bin/env node
/**
 * シードデータ投入スクリプト
 * 
 * 使用方法:
 * - ローカル環境: pnpm run seed:local
 * - 本番環境: pnpm run seed:prod
 * 
 * 環境変数:
 * - ENV: 環境名（local, dev, prod）
 * - WRANGLER_PATH: wranglerコマンドのパス（デフォルト: wrangler）
 * - DB_NAME: D1データベース名（デフォルト: DB）
 */

import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import fs from 'node:fs';

// 環境設定
const ENV = process.env.ENV || process.argv[2] || 'local';
const WRANGLER_PATH = process.env.WRANGLER_PATH || 'wrangler';
const DB_NAME = process.env.DB_NAME || 'DB';

// シードファイルのパス
const SEED_FILE = resolve(process.cwd(), 'drizzle', 'seed.sql');

// 実行環境に応じたフラグ
const isLocal = ENV === 'local';
const localFlag = isLocal ? '--local' : '';

console.log(`🌱 シードデータを投入します（環境: ${ENV}）`);

try {
  // シードファイルの存在確認
  if (!fs.existsSync(SEED_FILE)) {
    throw new Error(`シードファイルが見つかりません: ${SEED_FILE}`);
  }

  console.log("⚙️ シードデータを投入中: seed.sql");
  
  const command = `${WRANGLER_PATH} d1 execute ${DB_NAME} ${localFlag} --file=${SEED_FILE}`;
  console.log(`実行コマンド: ${command}`);
  
  execSync(command, { stdio: 'inherit' });
  console.log("✅ シードデータの投入が完了しました");

  process.exit(0);
} catch (error) {
  console.error('❌ シードデータの投入中にエラーが発生しました:', error);
  process.exit(1);
}
