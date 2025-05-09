# React Router + Cloudflare D1 連携ガイド

このドキュメントでは、React RouterプロジェクトにD1データベースを連携させる方法と、HMR（Hot Module Replacement）を正しく動作させるための設定について説明します。

## 目次

1. [プロジェクト構成](#プロジェクト構成)
2. [D1データベースの設定](#d1データベースの設定)
3. [マイグレーションファイルの作成](#マイグレーションファイルの作成)
4. [型定義の設定](#型定義の設定)
5. [ルートコンポーネントの作成](#ルートコンポーネントの作成)
6. [HMRの設定と注意点](#hmrの設定と注意点)

## プロジェクト構成

このプロジェクトは以下のような構成になっています：

```txt
packages/rr/
├── app/                    # React Routerアプリケーション
│   ├── routes/             # ルートコンポーネント
│   │   ├── +types/         # 型定義ファイル
│   │   ├── home.tsx        # ホームページ
│   │   ├── users.tsx       # ユーザー一覧ページ
│   │   └── products.tsx    # 商品一覧ページ
│   ├── root.tsx            # ルートレイアウト
│   └── routes.ts           # ルート定義
├── migrations/             # D1マイグレーションファイル
├── workers/                # Cloudflare Workersファイル
└── wrangler.jsonc          # Wrangler設定ファイル
```

## D1データベースの設定

### 1. D1データベースの作成

まず、Wranglerを使用してD1データベースを作成します：

```bash
npx wrangler d1 create <データベース名>
```

例：

```bash
npx wrangler d1 create rr-database
```

このコマンドを実行すると、データベースIDが生成されます。このIDは後で`wrangler.jsonc`ファイルに追加します。

### 2. wrangler.jsoncの設定

`wrangler.jsonc`ファイルにD1データベースの設定を追加します：

```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "rr-database",
      "database_id": "<データベースID>"
    }
  ]
}
```

この設定により、アプリケーション内で`context.cloudflare.env.DB`としてD1データベースにアクセスできるようになります。

## マイグレーションファイルの作成

### 1. マイグレーションディレクトリの作成

```bash
mkdir -p migrations
```

### 2. マイグレーションファイルの作成

`migrations`ディレクトリに、テーブル作成とデータ挿入のためのSQLファイルを作成します：

```sql
-- migrations/0000_initial.sql
-- テーブル作成
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 初期データ挿入
INSERT INTO users (name, email) VALUES
  ('山田太郎', 'taro@example.com'),
  ('佐藤花子', 'hanako@example.com');

-- 他のテーブルも同様に作成
```

### 3. マイグレーションの適用

ローカル環境でマイグレーションを適用します：

```bash
npx wrangler d1 migrations apply <データベース名> --local
```

例：

```bash
npx wrangler d1 migrations apply rr-database --local
```

本番環境にデプロイする場合は、`--local`フラグを外します：

```bash
npx wrangler d1 migrations apply rr-database
```

## 型定義の設定

### 1. Cloudflare環境の型定義生成

```bash
npx wrangler types
```

このコマンドを実行すると、`worker-configuration.d.ts`ファイルが生成され、Cloudflare環境の型定義が追加されます。

### 2. ルート用の型定義ファイルの作成

各ルートコンポーネント用の型定義ファイルを作成します：

```typescript
// app/routes/+types/users.ts
import type { LoaderFunctionArgs, MetaFunction } from "react-router";

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export namespace Route {
  export type LoaderArgs = LoaderFunctionArgs;
  export type MetaFn = MetaFunction;
  
  export interface LoaderData {
    users: User[];
  }
  
  export interface ComponentProps {
    loaderData: LoaderData;
  }
}
```

## ルートコンポーネントの作成

### 1. ルート定義の更新

`app/routes.ts`ファイルを更新して、新しいルートを追加します：

```typescript
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("users", "routes/users.tsx"),
  route("products", "routes/products.tsx")
] satisfies RouteConfig;
```

### 2. データ取得用のローダー関数の実装

各ルートコンポーネントにローダー関数を実装して、D1からデータを取得します：

```typescript
// app/routes/users.tsx
export async function loader({ context }: Route.LoaderArgs) {
  const { results } = await context.cloudflare.env.DB.prepare(
    "SELECT * FROM users ORDER BY id"
  ).all();
  
  return { users: results as User[] };
}
```

**注意点**: D1の型定義の問題により、`all<User>()`のようなジェネリック型を使用するとエラーが発生します。代わりに、`results as User[]`のように型アサーションを使用します。

## HMRの設定と注意点

React RouterプロジェクトでHMR（Hot Module Replacement）を正しく動作させるためには、以下の点に注意が必要です：

### 1. D1とHMRの連携

D1データベースを使用する場合、HMRが正しく動作するためには、以下の点に注意してください：

- ローカル開発時は常に`--local`フラグを使用してD1データベースを操作します
- `wrangler.jsonc`の設定が正しいことを確認します
- 開発サーバー起動時に`--persist`オプションを使用して、D1データの永続化を有効にします

### 2. 開発サーバーの起動

開発サーバーを起動する際は、以下のコマンドを使用します：

```bash
npm run dev
```

このコマンドは、`package.json`の`scripts`セクションで以下のように定義されています：

```json
{
  "scripts": {
    "dev": "react-router dev"
  }
}
```

`react-router dev`コマンドは、内部的にViteを使用してHMRを有効にしています。

### 3. HMRの動作確認

HMRが正しく動作しているかを確認するには、以下の手順を実行します：

1. 開発サーバーを起動します
2. ブラウザでアプリケーションを開きます
3. コンポーネントファイル（例：`app/routes/users.tsx`）を編集します
4. 保存すると、ブラウザが自動的に更新され、変更が反映されます

### 4. HMRのトラブルシューティング

HMRが正しく動作しない場合は、以下の点を確認してください：

- Viteの設定（`vite.config.ts`）が正しいことを確認します
- ブラウザのコンソールでエラーメッセージを確認します
- 必要に応じて、ブラウザのキャッシュをクリアします
- D1データベースの接続に問題がある場合は、`wrangler.jsonc`の設定を確認します

## まとめ

React RouterプロジェクトにD1データベースを連携させることで、サーバーサイドのデータをクライアントサイドで簡単に表示できるようになります。また、HMRを活用することで、開発効率を大幅に向上させることができます。

このガイドが、React RouterとCloudflare D1を連携させたアプリケーション開発の参考になれば幸いです。

## プロジェクト情報

このプロジェクトは、Cloudflare上で動作するReact RouterアプリケーションにHMR（Hot Module Replacement）を連携させるための調査プロジェクトです。

### プロジェクト略称

CRH (Cloudflare React router Hot module reload)

### 環境構築手順

1. プロジェクトのクローン後、依存関係をインストールします：

    ```bash
    pnpm install
    ```

2. 開発サーバーを起動します：

    ```bash
    cd packages/rr
    pnpm run dev
    ```

3. ブラウザで <http://localhost:5173> にアクセスして、アプリケーションを確認します。

### 参考資料

- [Cloudflare Workers上でのフルスタック開発](https://blog.cloudflare.com/ja-jp/full-stack-development-on-cloudflare-workers/)
- [Cloudflare Vite Plugin の紹介](https://blog.cloudflare.com/introducing-the-cloudflare-vite-plugin/)
