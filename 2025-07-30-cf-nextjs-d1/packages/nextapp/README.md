# Numbers App - Next.js + Cloudflare D1

id, name, number, created_atを持つnumbersテーブルで、初期データ5つを持ち、トップページにリストを表示するシンプルなアプリ

## 起動手順

1. ワークスペースルートから依存関係をインストール:

   ```bash
   pnpm install
   ```

2. データベースのマイグレーションを実行:

   ```bash
   pnpm db:migrate
   ```

3. Wranglerでアプリケーションを起動:

   ```bash
   pnpm dev:nextapp:wrangler
   ```

4. ブラウザで <http://localhost:8787> にアクセス

## データベース構造

`numbers`テーブル:

- `id`: 自動増分主キー
- `name`: 数値の名前（テキスト）
- `number`: 数値（整数）
- `created_at`: 作成日時（タイムスタンプ）

## 初期データ

以下の5つのレコードが自動で挿入されます:

- First Number: 42
- Second Number: 100
- Third Number: 256
- Fourth Number: 512
- Fifth Number: 1024

## 開発コマンド

- `pnpm dev:nextapp:wrangler`: Wranglerでアプリを起動（推奨）
- `pnpm db:migrate`: データベースマイグレーション実行
- `pnpm build:nextapp`: アプリケーションビルド

## 技術スタック

- Next.js 15
- Cloudflare D1（SQLite）
- Drizzle ORM
- Wrangler（開発サーバー）
