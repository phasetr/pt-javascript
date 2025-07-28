# Webアプリケーション用のDocker環境
# HonoX + Wrangler + D1環境

FROM node:20-slim

# 必要なパッケージのインストール
RUN apt-get update && apt-get install -y \
    curl \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリの設定
WORKDIR /app

# pnpmのインストール
RUN npm install -g pnpm@10

# パッケージファイルをコピー
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/wrangler/package.json ./packages/wrangler/
COPY packages/dkit/package.json ./packages/dkit/

# 依存関係のインストール
RUN pnpm install --frozen-lockfile

# プロジェクトファイルをコピー
COPY . .

# coreパッケージのビルド
RUN cd packages/core && pnpm build

# wranglerパッケージのビルド
RUN cd packages/wrangler && pnpm build

# データベースマイグレーションの実行
RUN cd packages/wrangler && pnpm d1:migrate:local

# ポートの公開
EXPOSE 8788

# wranglerパッケージディレクトリに移動
WORKDIR /app/packages/wrangler

# wrangler dev実行（Docker用）
CMD ["pnpm", "dev:docker"]