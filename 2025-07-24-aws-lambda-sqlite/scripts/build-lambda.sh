#!/bin/bash
set -euo pipefail

# Lambda用のZIPファイルをビルドするスクリプト

# スクリプトのディレクトリを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
API_DIR="$PROJECT_ROOT/packages/api"

echo "Lambda ZIPファイルをビルドしています..."

# APIディレクトリに移動
cd "$API_DIR"

# クリーンアップ
echo "クリーンアップ中..."
rm -rf dist lambda.zip

# TypeScriptをビルド
echo "TypeScriptをビルド中..."
pnpm build

# lambda.tsをindex.jsとしてコピー（Lambda実行用）
cp dist/lambda.js dist/index.js

# package.jsonを生成（ESモジュール対応）
cat > dist/package.json << 'EOF'
{
  "name": "aws-lambda-sqlite-api",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js"
}
EOF

# ZIPファイル作成
echo "ZIPファイルを作成中..."
cd dist
zip -r ../lambda.zip . -x "*.map" -x "test/*"
cd ..

# node_modulesを追加
echo "依存関係を追加中..."
zip -r lambda.zip node_modules -x "*/test/*" -x "*/.bin/*" -x "*/tsx/*" -x "*/typescript/*" -x "*/vitest/*" -x "*/@types/*"

echo "Lambda ZIPファイルのビルドが完了しました: $API_DIR/lambda.zip"