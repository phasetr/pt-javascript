# Remix API プロジェクトドキュメント

このドキュメントでは、Remix APIプロジェクトの起動方法とAPIの挙動確認手順について説明するのだ。

## 目次

1. [起動方法](#起動方法)
2. [APIエンドポイント](#apiエンドポイント)
3. [curlによる挙動確認](#curlによる挙動確認)
4. [プロジェクト概要](#プロジェクト概要)
5. [ディレクトリ構造](#ディレクトリ構造)
6. [開発ガイド](#開発ガイド)

## 起動方法

### 開発環境での起動

```bash
# 依存関係のインストール（初回のみ）
npm install

# 開発サーバーの起動
npm run dev
```

開発サーバーは通常<http://localhost:5173>で起動するのだ。

### 本番環境での起動

```bash
# ビルド
npm run build

# 本番サーバーの起動
npm start
```

## APIエンドポイント

このプロジェクトには以下のAPIエンドポイントが実装されているのだ：

1. **シンプルなAPIエンドポイント**
   - URL: `/api/example`
   - メソッド: GET
   - レスポンス: `{ "message": "Hello, API!" }`

2. **Honoを使用したAPIエンドポイント**
   - URL: `/api/hono`
   - メソッド: GET
   - レスポンス: `{ "message": "Hello from hono within Remix: 2025/3/24 13:42:24" }` (日本時間を含む)

3. **WebSocket (SSE) エンドポイント**
   - URL: `/api/websocket`
   - メソッド: GET
   - 機能: Server-Sent Events (SSE) を使用したリアルタイム通信
   - テストページ: `/websocket-test`

4. **WebSocketメッセージ送信エンドポイント**
   - URL: `/api/websocket/send`
   - メソッド: POST
   - リクエストボディ: `{ "message": "送信するメッセージ" }`
   - レスポンス: `{ "success": true, "clientCount": 1, "message": { ... } }`

## curlによる挙動確認

### シンプルなAPIエンドポイントの確認

```bash
# サーバーが起動していることを確認してから実行
curl http://localhost:5173/api/example
```

期待されるレスポンス:

```json
{"message":"Hello, API!"}
```

### Honoを使用したAPIエンドポイントの確認

```bash
# サーバーが起動していることを確認してから実行
curl http://localhost:5173/api/hono
```

期待されるレスポンス:

```json
{"message":"Hello from hono within Remix: 2025/3/24 13:42:24"}
```

注意: レスポンスには現在の日本時間が含まれるため、実行時刻によって異なるのだ。

### WebSocketメッセージ送信の確認

```bash
# サーバーが起動していることを確認してから実行
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"こんにちは、WebSocket!"}' \
  http://localhost:5173/api/websocket/send
```

期待されるレスポンス:

```json
{"success":true,"clientCount":0,"message":{"type":"message","message":"こんにちは、WebSocket!","timestamp":"2025-03-24T01:19:00.000Z","clientCount":0}}
```

## プロジェクト概要

このプロジェクトは、Remixフレームワークを使用したウェブアプリケーションで、以下の技術スタックを採用しているのだ：

- **Remix**: Reactベースのフルスタックウェブフレームワーク
- **TypeScript**: 型安全なJavaScriptのスーパーセット
- **Tailwind CSS**: ユーティリティファーストのCSSフレームワーク
- **Hono**: 軽量なウェブフレームワーク（APIエンドポイントの一部で使用）
- **Vite**: 高速なフロントエンドビルドツール
- **Server-Sent Events (SSE)**: WebSocketの代替としてリアルタイム通信に使用

## ディレクトリ構造

```txt
/
├── app/                    # アプリケーションのソースコード
│   ├── entry.client.tsx    # クライアントエントリーポイント
│   ├── entry.server.tsx    # サーバーエントリーポイント
│   ├── root.tsx            # ルートレイアウト
│   ├── routes/             # ルート定義
│   │   ├── _index.tsx      # ホームページ
│   │   ├── api.example.tsx # シンプルなAPIエンドポイント
│   │   ├── api.hono.tsx    # Honoを使用したAPIエンドポイント
│   │   └── api.websocket.tsx # SSEを使用したWebSocketエンドポイント
│   └── tailwind.css        # Tailwind CSSスタイル
├── public/                 # 静的ファイル
├── build/                  # ビルド出力（gitignore）
├── package.json            # プロジェクト設定
├── tailwind.config.ts      # Tailwind CSS設定
├── tsconfig.json           # TypeScript設定
└── vite.config.ts          # Vite設定
```

## 開発ガイド

### 新しいAPIエンドポイントの追加

1. `app/routes/` ディレクトリに新しいファイルを作成する
2. ファイル名は `api.{エンドポイント名}.tsx` の形式にする
3. `loader` 関数（GETリクエスト用）や `action` 関数（POST、PUT、DELETEリクエスト用）を実装する

#### シンプルなAPIエンドポイントの例

```tsx
export const loader = async () => {
  const data = { message: "Hello, API!" };
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
```

#### Honoを使用したAPIエンドポイントの例

```tsx
import { Hono } from 'hono';

// 日本時間を取得する関数
function nowJst() {
  const now = new Date();
  return now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

const app = new Hono();

app.get('/', (c) => {
  const jst = nowJst();
  console.log(`現在の日本時刻: ${jst}`);
  return c.json({ message: `Hello from hono within Remix: ${jst}` });
});

export const loader = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace('/api/your-endpoint', '/');
  const newRequest = new Request(url.toString(), request);
  return await app.fetch(newRequest);
};

export const action = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace('/api/your-endpoint', '/');
  const newRequest = new Request(url.toString(), request);
  return await app.fetch(newRequest);
};
```

### スタイリング

このプロジェクトではTailwind CSSを使用しているのだ。新しいスタイルを追加する場合は、Tailwindのユーティリティクラスを使用するか、必要に応じて`tailwind.config.ts`ファイルを編集するのだ。

### ビルドとデプロイ

プロジェクトをビルドするには：

```bash
npm run build
```

ビルド後、`build/`ディレクトリに以下のファイルが生成されるのだ：

- `build/server/` - サーバーサイドのコード
- `build/client/` - クライアントサイドのコード

本番環境にデプロイする場合は、これらのファイルをサーバーにアップロードし、`npm start`コマンドを実行するのだ。
