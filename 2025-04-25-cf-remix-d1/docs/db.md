# Cloudflare D1データベース利用ガイド

このドキュメントでは、Cloudflare D1データベースの利用方法、複数パッケージからの接続方法、および`.wrangler-persist`を活用したローカル開発環境の設定について説明します。

## 目次

1. [D1データベースの概要](#1-d1データベースの概要)
2. [プロジェクト構成](#2-プロジェクト構成)
3. [.wrangler-persistの役割](#3-wrangler-persistの役割)
4. [複数パッケージからのD1利用](#4-複数パッケージからのd1利用)
5. [マイグレーション管理](#5-マイグレーション管理)
6. [ローカル開発環境の設定](#6-ローカル開発環境の設定)
7. [本番環境への反映](#7-本番環境への反映)
8. [トラブルシューティング](#8-トラブルシューティング)

## 1. D1データベースの概要

Cloudflare D1は、Cloudflare Workersプラットフォーム上で動作するSQLiteベースのリレーショナルデータベースです。D1はエッジで動作し、低レイテンシーでグローバルに分散されたデータベースソリューションを提供します。

### 主な特徴

- SQLiteと互換性があり、標準的なSQLクエリをサポート
- Cloudflare Workersと統合されており、Workersから直接アクセス可能
- グローバルに分散され、低レイテンシーでデータにアクセス可能
- Wranglerを使用してローカル開発環境でも利用可能

## 2. プロジェクト構成

このプロジェクトでは、以下のようにD1データベースを利用しています：

```txt
/
├── .wrangler-persist/        # ローカル開発用のD1データベース永続化ディレクトリ
├── packages/
│   ├── db/                   # データベース関連のコード
│   │   ├── drizzle/          # マイグレーションファイル
│   │   ├── drizzle.config.ts # Drizzle ORM設定
│   │   └── src/
│   │       ├── index.ts      # スキーマのエクスポート
│   │       └── schema.ts     # テーブル定義
│   │
│   ├── rr/                   # React Routerアプリケーション
│   │   ├── wrangler.jsonc    # D1設定を含むWrangler設定
│   │   └── app/utils/db.ts   # D1接続ユーティリティ
│   │
│   └── hono-api/             # Hono APIバックエンド
│       ├── wrangler.jsonc    # D1設定を含むWrangler設定
│       └── src/index.ts      # D1を使用するAPIコード
```

## 3. .wrangler-persistの役割

`.wrangler-persist`ディレクトリは、ローカル開発環境でのD1データベースの状態を永続化するために使用されます。このディレクトリには、ローカル開発時に使用されるSQLiteデータベースファイルが保存されます。

### 重要なポイント

- `.wrangler-persist`ディレクトリは通常`.gitignore`に追加され、リポジトリにコミットされません
- ローカル開発環境でのみ使用され、本番環境には影響しません
- 複数のパッケージが同じD1データベースを参照する場合、同じ`.wrangler-persist`ディレクトリを共有することで、一貫したデータ状態を維持できます

### drizzle.config.tsでの設定例

```typescript
// packages/db/drizzle.config.ts
export default {
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    // ローカル開発時は共有永続化ディレクトリ内のSQLiteファイルを使用
    url: "../../.wrangler-persist/v3/d1/miniflare-D1DatabaseObject/f253421848505bfd644490698e36d17977501ad2587c6ba0fd479180a316f09a.sqlite",
  },
} satisfies Config;
```

## 4. 複数パッケージからのD1利用

複数のパッケージ（例：React RouterフロントエンドとHono API）から同じD1データベースを利用するには、以下の設定が必要です：

### 1. 共通のデータベースID

各パッケージの`wrangler.jsonc`ファイルで、同じ`database_id`を指定します：

```jsonc
// packages/rr/wrangler.jsonc および packages/hono-api/wrangler.jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "crd-sample-db",
      "database_id": "f2883ac9-8383-40c2-956c-4be15f5cc9de",
      "migrations_dir": "../db/drizzle"
    }
  ]
}
```

### 2. 共通のマイグレーションディレクトリ

両方のパッケージが同じマイグレーションディレクトリを参照することで、スキーマの一貫性を確保します：

```jsonc
"migrations_dir": "../db/drizzle"
```

> **注意**: `migrations_dir`のデフォルト値は`./migrations`ですが、このプロジェクトではモノレポ構造を採用しているため、共通のマイグレーションファイルを`packages/db/drizzle`ディレクトリに集約しています。これにより、複数のパッケージ（React RouterとHono API）が同じマイグレーション定義を共有でき、データベーススキーマの一貫性を保つことができます。

### 3. 共通のスキーマパッケージ

`packages/db`パッケージでスキーマを定義し、他のパッケージから参照します：

```typescript
// packages/db/src/index.ts
export * from "./schema.js";
export type { D1Database } from "@cloudflare/workers-types";

// packages/rr/app/utils/db.ts
import * as schema from "db";
import { drizzle } from "drizzle-orm/d1";

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

// packages/hono-api/src/index.ts
import { customers as customersTable } from "db";
import type { D1Database } from "db";
import { drizzle } from "drizzle-orm/d1";
```

## 5. マイグレーション管理

Drizzle ORMとWranglerを使用してマイグレーションを管理します：

### 1. マイグレーションファイルの生成

スキーマに変更を加えた後、以下のコマンドでマイグレーションファイルを生成します：

```bash
pnpm db:generate
```

このコマンドは`packages/db/drizzle`ディレクトリにマイグレーションファイルを生成します。

### 2. ローカル環境へのマイグレーション適用

```bash
# Drizzle KitでSQLiteスキーマを更新
pnpm db:push:local

# Wranglerでマイグレーションを適用
pnpm db:migrate:local
```

### 3. 本番環境へのマイグレーション適用

```bash
# Drizzle KitでSQLiteスキーマを更新
pnpm db:push:prod

# Wranglerでマイグレーションを適用
pnpm db:migrate:prod
```

## 6. ローカル開発環境の設定

### 1. ローカル開発サーバーの起動

```bash
# React Routerアプリケーションの起動
pnpm rr:dev

# Hono APIの起動
pnpm hono:dev
```

これらのコマンドは、Wranglerを使用してローカル開発サーバーを起動し、`.wrangler-persist`ディレクトリを使用してD1データベースの状態を永続化します。

### 2. 永続化オプションの指定

ローカル開発時に`--persist-to`オプションを使用して、永続化ディレクトリを明示的に指定することもできます：

```bash
wrangler dev --persist-to .wrangler-persist
```

このプロジェクトでは、`package.json`のスクリプトで自動的に設定されています：

```json
"db:migrate:local": "cd packages/rr && wrangler d1 migrations apply DB --local --persist-to ../../.wrangler-persist"
```

### 3. 複数のパッケージでの共有

複数のパッケージが同じD1データベースを使用する場合、同じ`.wrangler-persist`ディレクトリを参照することで、一貫したデータ状態を維持できます。

## 7. 本番環境への反映

### 1. D1データベースの作成（初回のみ）

```bash
wrangler d1 create crd-sample-db
```

このコマンドで生成された`database_id`を各パッケージの`wrangler.jsonc`に設定します。

### 2. マイグレーションの適用

```bash
pnpm db:migrate:prod
```

### 3. アプリケーションのデプロイ

```bash
# React Routerアプリケーションのデプロイ
cd packages/rr
pnpm deploy

# Hono APIのデプロイ
cd packages/hono-api
pnpm deploy
```

## 8. トラブルシューティング

### 1. React RouterからD1データベースへの接続に関する注意点

ローカル開発環境でReact RouterアプリケーションからD1データベース（.wrangler-persist内のSQLite）に接続する際の主な注意点：

1. **wrangler.jsonc の設定**：
   - `migrations_dir`が正しく設定されているか確認する（例：`"../db/drizzle"`）
   - `database_id`が全てのパッケージで同一であることを確認する
   - `binding`名（例：`"DB"`）が一致していることを確認する

2. **.wrangler-persist ディレクトリの設定**：
   - `package.json`の`dev`スクリプトで`--persist-to`オプションが正しく設定されているか確認する：

     ```json
     "dev": "wrangler dev --persist-to ../../.wrangler-persist"
     ```

   - 相対パスが正しいことを確認する（モノレポ構造の場合、通常はプロジェクトルートからの相対パス）

3. **SQLiteファイルのパス**：
   - `drizzle.config.ts`で指定されているSQLiteファイルのパスが実際のファイルと一致しているか確認する
   - 初回実行時は`.wrangler-persist`ディレクトリが自動生成されるため、パスが存在しない場合がある
   - SQLiteファイルのパスは以下のようなパターンになる：

     ```txt
     .wrangler-persist/v3/d1/miniflare-D1DatabaseObject/[ハッシュ値].sqlite
     ```

   - ハッシュ値は環境によって異なるため、実際のファイルパスを確認する必要がある

4. **実行順序**：
   - 最初に`wrangler dev`を実行して`.wrangler-persist`ディレクトリを生成する
   - 次にマイグレーションを適用する
   - その後、drizzle-kitのコマンドを実行する

5. **パーミッションの問題**：
   - `.wrangler-persist`ディレクトリとSQLiteファイルの読み書き権限を確認する
   - 特にチーム開発環境では、権限の問題が発生することがある

6. **デバッグ方法**：
   - SQLiteファイルが存在するか確認：`ls -la .wrangler-persist/v3/d1/miniflare-D1DatabaseObject/`
   - SQLiteファイルが正しく作成されているか確認：`sqlite3 [SQLiteファイルのパス] .tables`
   - wranglerのログレベルを上げる：`WRANGLER_LOG=debug wrangler dev --persist-to .wrangler-persist`

### 2. .wrangler-persistディレクトリが見つからない

`.wrangler-persist`ディレクトリが存在しない場合、以下のコマンドでローカル開発サーバーを起動すると自動的に作成されます：

```bash
wrangler dev --persist-to .wrangler-persist
```

### 2. ローカルデータベースの初期化

ローカルデータベースを初期化するには、SQLファイルを実行します：

```bash
wrangler d1 execute crd-sample-db --local --file=./schema.sql --persist-to .wrangler-persist
```

### 3. データベースパスの確認

Drizzle ORMの設定ファイル（`drizzle.config.ts`）で指定されているSQLiteファイルのパスが正しいか確認してください。パスは`.wrangler-persist`ディレクトリ内のSQLiteファイルを指している必要があります。

### 4. 複数パッケージでの同期の問題

複数のパッケージが同じD1データベースを使用する場合、以下の点を確認してください：

- 各パッケージの`wrangler.jsonc`で同じ`database_id`を指定しているか
- 同じ`.wrangler-persist`ディレクトリを参照しているか
- 共通のマイグレーションディレクトリを使用しているか

### 5. マイグレーションの競合

マイグレーションの競合が発生した場合、以下の手順で解決できます：

1. ローカルデータベースをリセット
2. 最新のマイグレーションファイルを適用

```bash
# ローカルデータベースのリセット
rm -rf .wrangler-persist

# マイグレーションの再適用
pnpm db:migrate:local
```

## まとめ

Cloudflare D1データベースは、Cloudflare Workersプラットフォーム上で動作するSQLiteベースのリレーショナルデータベースです。`.wrangler-persist`ディレクトリを使用することで、ローカル開発環境でのデータベース状態を永続化し、複数のパッケージから同じデータベースを利用することができます。Drizzle ORMとWranglerを組み合わせることで、効率的なマイグレーション管理が可能になります。
