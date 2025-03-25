#!/usr/bin/env node
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// Remixアプリケーションのビルド
console.log('Building Remix App...');
const remixDir = path.join(__dirname, '../apps/remix');
const remixBuildDir = path.join(remixDir, 'build');

// buildディレクトリが存在しない場合は作成
if (!fs.existsSync(remixBuildDir)) {
  fs.mkdirSync(remixBuildDir, { recursive: true });
}

try {
  // ビルドコマンドを実行
  execSync('npm run build', { cwd: remixDir, stdio: 'inherit' });
  console.log('Remix App build completed successfully.');
} catch (error) {
  console.error('Error building Remix App:', error);
  process.exit(1);
}
