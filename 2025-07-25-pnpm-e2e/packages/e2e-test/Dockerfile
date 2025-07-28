# E2Eテスト用のDocker環境
# Playwright + Node.js + pnpm環境

FROM mcr.microsoft.com/playwright:v1.54.1-jammy

# 作業ディレクトリの設定
WORKDIR /app

# pnpmのインストール
RUN npm install -g pnpm@10

# Node.jsのバージョン確認（デバッグ用）
RUN node --version && npm --version && pnpm --version

# パッケージファイルをコピー
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/e2e-test/package.json ./packages/e2e-test/
COPY packages/dkit/package.json ./packages/dkit/
COPY packages/web/package.json ./packages/web/

# 依存関係のインストール
RUN pnpm install --frozen-lockfile

# プロジェクトファイルをコピー
COPY . .

# coreパッケージのビルド
RUN cd packages/core && pnpm build

# e2e-testディレクトリに移動
WORKDIR /app/packages/e2e-test

# テスト実行のデフォルトコマンド
CMD ["pnpm", "test:docker"]