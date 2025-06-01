# PrismaからDrizzle ORMへの移行作業

## ユーザーからの指示

> dbは現在Prismaを利用していますが、これをdrizzleに変えてください。
> 個別パッケージにwranglerがあるなら、wranglerはルートのpackage.jsonに統合して最新化してください。

## 対応内容

### 1. 現状調査

プロジェクト内のPrisma関連ファイルと設定を調査した結果：

- **データベースタイプ**: SQLite（`file:./dev.db`）
- **Prismaスキーマ**: `/packages/db/prisma/schema.prisma`
- **モデル定義**: Userモデル（id, email, name, createdAt, updatedAt）
- **依存関係**:
  - `@prisma/client`: ^5.22.0
  - `prisma`: ^5.22.0
- **問題点**: Cloudflare D1との統合が正しく実装されていない

### 2. Drizzle ORMへの移行手順

#### 2.1 依存関係のインストール

```bash
cd packages/db
pnpm add drizzle-orm better-sqlite3
pnpm add -D drizzle-kit @types/better-sqlite3
```

後にCloudflare Workers環境対応のため、better-sqlite3を削除し、@cloudflare/workers-typesを追加。

#### 2.2 スキーマファイルの作成

Prismaスキーマから変換してDrizzle用のスキーマを作成：

`packages/db/src/schema/users.ts`:

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});
```

#### 2.3 Drizzle設定ファイルの作成

`packages/db/drizzle.config.ts`:

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/*.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    databaseId: 'b20c8cfb-8038-43a9-94a7-07b03f8b0fb0',
    token: process.env.CLOUDFLARE_D1_TOKEN || '',
  },
} satisfies Config;
```

#### 2.4 データベース接続設定

`packages/db/src/client.ts`:

```typescript
import { drizzle } from 'drizzle-orm/d1';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

export function createD1Db(d1Database: D1Database): DrizzleD1Database<typeof schema> {
  return drizzle(d1Database, { schema });
}
```

#### 2.5 既存コードの更新

hono-apiパッケージのPrismaClient使用箇所をDrizzleに置き換え：

```typescript
// Before
import { PrismaClient } from 'db'

// After
import { createD1Db, users } from '../../db/src'
import { eq } from 'drizzle-orm'
```

### 3. Cloudflare D1との統合

#### 3.1 D1データベースの作成

```bash
wrangler d1 create crd-sample-db
```

生成されたdatabase_id: `b20c8cfb-8038-43a9-94a7-07b03f8b0fb0`

#### 3.2 wrangler.jsonc設定の更新

両パッケージ（hono-api、rr）のwrangler.jsoncに追加：

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "crd-sample-db",
    "database_id": "b20c8cfb-8038-43a9-94a7-07b03f8b0fb0",
    "migrations_dir": "../db/drizzle/migrations"
  }
]
```

#### 3.3 マイグレーションの実行

```bash
# マイグレーションファイルの生成
cd packages/db
pnpm db:generate

# ローカルD1データベースへの適用
cd packages/hono-api
wrangler d1 migrations apply crd-sample-db --local
```

### 4. package.jsonスクリプトの更新

Prisma用からDrizzle用に変更：

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:drop": "drizzle-kit drop"
  }
}
```

### 5. Prisma関連ファイルの削除

- `packages/db/prisma/`ディレクトリを削除
- Prisma依存関係（`@prisma/client`、`prisma`）を削除

### 6. wranglerの統合

調査の結果、wranglerは既にルートのpackage.jsonに最新版（4.18.0）で統合されており、個別パッケージからは削除済みであることを確認。

## 技術的な課題と解決

### 問題1: better-sqlite3がCloudflare Workers環境で使用不可

**解決**:

- better-sqlite3を削除
- Drizzleのd1ドライバーを使用
- `drizzle-orm/d1`からインポート

### 問題2: パッケージ間の依存関係解決

**解決**:

- 相対パスインポートを使用（`../../db/src`）
- wranglerの設定でnodejs_compatフラグを有効化

## 成果物

- Drizzle ORMへの完全移行完了
- Cloudflare D1データベースとの適切な統合
- 型安全なデータベースアクセス実装
- マイグレーション管理の確立
- wranglerの一元管理による保守性向上

## 今後の推奨事項

1. 本番環境へのマイグレーション適用（`--remote`フラグ使用）
2. Drizzle Studioを使用したデータベース管理
3. 環境変数の適切な管理（CLOUDFLARE_ACCOUNT_ID、CLOUDFLARE_D1_TOKEN）
4. テストコードの追加
