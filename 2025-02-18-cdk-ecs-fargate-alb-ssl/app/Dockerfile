# Dockerfile for a TypeScript web application

# Node.js LTS バージョンをベースイメージとして使用
FROM node:23-slim

WORKDIR /app

# パッケージファイルを先にコピーし、依存関係をインストール（キャッシュ対策）
COPY package.json package-lock.json ./
RUN npm install

# アプリケーションのソースコードをコピー
COPY . .

# TypeScript のビルド（build フォルダに出力される想定）
RUN npm run build

# アプリが利用するポートを公開（例:3000）
EXPOSE 3000

# アプリケーションの起動コマンド
CMD ["node", "build/index.js"]
