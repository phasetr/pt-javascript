#!/usr/bin/env node
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// Honoアプリケーションのビルド
console.log('Building Hono API...');
const honoDir = path.join(__dirname, '../apps/hono-api');
const honoDistDir = path.join(honoDir, 'dist');

// distディレクトリが存在しない場合は作成
if (!fs.existsSync(honoDistDir)) {
  fs.mkdirSync(honoDistDir, { recursive: true });
}

try {
  // ビルドコマンドを実行
  execSync('npm run build', { cwd: honoDir, stdio: 'inherit' });
  console.log('Hono API build completed successfully.');
} catch (error) {
  console.error('Error building Hono API:', error);
  process.exit(1);
}
