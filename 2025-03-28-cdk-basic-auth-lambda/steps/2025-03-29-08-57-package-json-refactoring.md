# package.jsonの整理とテスト実行の改善

## 概要

このドキュメントでは、以下の改善を行った内容をまとめています：

1. run-tests.tsファイルを削除し、package.jsonのスクリプトを使用して簡潔にテスト実行できるように修正
2. ルート直下のpackage.jsonのコマンドを整理し、より使いやすく構造化

## 実施した変更

### 1. run-tests.tsファイルの削除

複雑なスクリプトファイルを削除し、package.jsonのスクリプトに機能を集約しました。

```bash
rm packages/integration-tests/src/run-tests.ts
```

### 2. packages/integration-tests/package.jsonの修正

run-tests.tsを使用するスクリプトを削除し、環境変数`TEST_ENV`を使用するシンプルなテスト実行スクリプトを維持しました。

```json
{
  "name": "integration-tests",
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:local": "TEST_ENV=local vitest run",
    "test:dev": "TEST_ENV=dev vitest run",
    "test:prod": "TEST_ENV=prod vitest run",
    "test:watch": "vitest",
    "build": "tsc",
    "test:connection": "tsx src/test-connection.ts",
    "test:connection:local": "TEST_ENV=local tsx src/test-connection.ts",
    "test:connection:dev": "TEST_ENV=dev tsx src/test-connection.ts",
    "test:connection:prod": "TEST_ENV=prod tsx src/test-connection.ts"
  },
  ...
}
```

### 3. ルートpackage.jsonの改善

package.jsonのスクリプトをカテゴリごとに整理し、コメントを追加して使いやすくしました。

```json
{
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    
    "# === ローカル開発環境コマンド ===": "",
    "local:start": "pnpm db:start && pnpm api:start",
    "local:stop": "pnpm api:stop || true && pnpm db:stop",
    "local:restart": "pnpm local:stop && pnpm local:start",
    "local:logs": "pnpm api:logs",
    "local:status": "pnpm api:status",
    
    "# === 結合テストコマンド ===": "",
    "test:integration:local": "# ローカル環境でのテスト実行（事前に pnpm local:start を実行してください）\npnpm --filter integration-tests test:connection:local && pnpm --filter integration-tests test:local",
    "test:integration:dev": "# 開発環境でのテスト実行\npnpm --filter integration-tests test:connection:dev && pnpm --filter integration-tests test:dev",
    "test:integration:prod": "# 本番環境でのテスト実行\npnpm --filter integration-tests test:connection:prod && pnpm --filter integration-tests test:prod",
    
    "# === デプロイコマンド ===": "",
    "deploy:dev": "pnpm build && pnpm prepare:deploy && pnpm --filter cbal deploy:dev",
    "deploy:prod": "pnpm build && pnpm prepare:deploy && pnpm --filter cbal deploy:prod",
    "destroy:dev": "pnpm --filter cbal destroy:dev",
    "destroy:prod": "pnpm --filter cbal destroy:prod",
    
    "# === 内部コマンド（直接実行しないでください） ===": "",
    "prepare:deploy": "node scripts/prepare-deploy.js",
    "db:start": "docker compose up -d dynamodb-local dynamodb-admin",
    "db:stop": "docker compose down",
    "api:start": "pnpm --filter db build && pnpm prepare:deploy && pm2 start --name hono-api 'pnpm --filter=hono-api dev'",
    "api:stop": "pm2 stop hono-api && pm2 delete hono-api",
    "api:logs": "pm2 logs hono-api",
    "api:status": "pm2 status hono-api",
    "dev:hono": "pnpm --filter db build && pnpm prepare:deploy && pnpm --filter=hono-api dev"
  },
  ...
}
```

主な改善点：

1. **カテゴリ分けによる可読性向上**
   - ローカル開発環境コマンド
   - 結合テストコマンド
   - デプロイコマンド
   - 内部コマンド（直接実行しないもの）

2. **コマンドの追加と改善**
   - `deploy:prod`と`destroy:prod`を追加
   - `local:logs`と`local:status`を追加
   - 各コマンドに説明コメントを追加

3. **使いやすさの向上**
   - 頻繁に使用するコマンドを上部に配置
   - 内部的に使用されるコマンドを下部に移動
   - 各コマンドの目的を明確化

## テスト実行方法

ローカル環境でのテスト実行は以下の手順で行います：

1. ローカル環境を起動:

   ```txt
   pnpm local:start
   ```

2. テストを実行:

   ```txt
   pnpm test:integration:local
   ```

3. 完了後、ローカル環境を停止:

   ```txt
   pnpm local:stop
   ```

## 主要コマンド一覧

### ローカル開発環境

```bash
# 環境起動
pnpm local:start

# 環境停止
pnpm local:stop

# 環境再起動
pnpm local:restart

# ログ確認
pnpm local:logs

# 状態確認
pnpm local:status
```

### 結合テスト

```bash
# ローカル環境でのテスト実行（事前にpnpm local:startを実行）
pnpm test:integration:local

# 開発環境でのテスト実行
pnpm test:integration:dev

# 本番環境でのテスト実行
pnpm test:integration:prod
```

### デプロイ

```bash
# 開発環境へのデプロイ
pnpm deploy:dev

# 本番環境へのデプロイ
pnpm deploy:prod

# 開発環境のリソース削除
pnpm destroy:dev

# 本番環境のリソース削除
pnpm destroy:prod
```

## まとめ

これらの変更により、複雑なスクリプトファイルを使わずに、標準的なnpmスクリプトでテストを実行できるようになりました。また、package.jsonのスクリプトがより整理され、使いやすくなりました。
