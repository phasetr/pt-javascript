#!/bin/bash
set -e

echo "Building Lambda function..."

# 依存関係のインストール
echo "Installing dependencies..."
pnpm install

# TypeScriptのコンパイル
echo "Compiling TypeScript..."
pnpm run build

# distディレクトリが存在することを確認
if [ ! -d "dist" ]; then
  echo "Error: dist directory not found after build"
  exit 1
fi

# 本番環境用の依存関係をインストール
echo "Installing production dependencies..."
cd dist
npm init -y
npm install --save \
  @aws-sdk/client-ses@^3.540.0 \
  @aws-sdk/client-sqs@^3.540.0 \
  @smithy/config-resolver@^2.2.0 \
  @smithy/core@^1.3.0 \
  @smithy/fetch-http-handler@^2.5.0 \
  @smithy/middleware-content-length@^2.1.0 \
  @smithy/middleware-endpoint@^2.5.0 \
  @smithy/middleware-retry@^2.2.0 \
  @smithy/middleware-serde@^2.1.0 \
  @smithy/node-config-provider@^2.2.0 \
  @smithy/node-http-handler@^2.4.0 \
  @smithy/property-provider@^2.1.0 \
  @smithy/protocol-http@^3.2.0 \
  @smithy/smithy-client@^2.4.0 \
  @smithy/types@^2.10.0 \
  @smithy/url-parser@^2.1.0 \
  @smithy/util-base64@^2.1.0 \
  @smithy/util-body-length-browser@^2.1.0 \
  @smithy/util-body-length-node@^2.2.0 \
  @smithy/util-defaults-mode-browser@^2.1.0 \
  @smithy/util-defaults-mode-node@^2.2.0 \
  @smithy/util-hex-encoding@^2.1.0 \
  @smithy/util-middleware@^2.1.0 \
  @smithy/util-retry@^2.1.0 \
  @smithy/util-utf8@^2.1.0
cd ..

echo "Lambda function build completed successfully!"
