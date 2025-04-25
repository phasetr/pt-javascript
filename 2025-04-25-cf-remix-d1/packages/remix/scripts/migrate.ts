#!/usr/bin/env node
/**
 * マイグレーションスクリプト
 * 
 * 使用方法:
 * - ローカル環境: pnpm run migrate:local
 * - 本番環境: pnpm run migrate:prod
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

// マイグレーションファイルのパス
const MIGRATIONS_DIR = resolve(process.cwd(), 'drizzle');

// 実行環境に応じたフラグ
const isLocal = ENV === 'local';
const localFlag = isLocal ? '--local' : '';

console.log(`🚀 マイグレーションを実行します（環境: ${ENV}）`);

try {
  // マイグレーションディレクトリの存在確認
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`マイグレーションディレクトリが見つかりません: ${MIGRATIONS_DIR}`);
  }

  // マイグレーションファイルの取得（数字順にソート）
  const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql') && !file.includes('seed'))
    .sort();

  if (migrationFiles.length === 0) {
    throw new Error('マイグレーションファイルが見つかりません');
  }

  console.log(`📋 実行するマイグレーションファイル: ${migrationFiles.length}個`);

  // 各マイグレーションファイルを実行
  for (const file of migrationFiles) {
    const filePath = resolve(MIGRATIONS_DIR, file);
    console.log(`⚙️ マイグレーションを実行中: ${file}`);
    
    const command = `${WRANGLER_PATH} d1 execute ${DB_NAME} ${localFlag} --file=${filePath}`;
    console.log(`実行コマンド: ${command}`);
    
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ マイグレーション完了: ${file}`);
  }

  console.log('🎉 すべてのマイグレーションが正常に完了しました');
  process.exit(0);
} catch (error) {
  console.error('❌ マイグレーション中にエラーが発生しました:', error);
  process.exit(1);
}
