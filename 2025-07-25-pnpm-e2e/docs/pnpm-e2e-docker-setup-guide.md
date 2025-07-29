# pnpm E2Eテスト・Docker化設定ガイド

作成日時: 2025-07-29
参考: <steps/20250728-2102-feat-pnpm-e2e-test-setup.md>

## 概要

wranglerサービス（HonoX + Cloudflare D1）でのE2Eテスト環境構築における実戦経験から得た知見をまとめた新規設定用ガイドです。Docker環境での安定した21/21テスト成功を目指した実装ノウハウを記録しています。

## 目標アーキテクチャ

```text
┌─────────────────────────────────────────┐
│          pnpm モノレポ                  │
├─────────────────────────────────────────┤
│ packages/                               │
│ ├── core/              # 共通ロジック   │
│ ├── wrangler/          # HonoX アプリ   │
│ ├── wrangler-e2e/      # E2Eテスト     │
│ └── dkit/              # DB ツール     │
├─────────────────────────────────────────┤
│          Docker環境                     │
│ ├── web service        # wrangler dev  │
│ └── e2e-test service   # Playwright    │
└─────────────────────────────────────────┘
```

## 重要な設定ポイント

### 1. wrangler起動設定

#### 最重要：ポート固定化

```json
// package.json scripts
{
  "dev": "wrangler dev --local --persist-to ../../.wrangler-persist --port 8787",
  "dev:docker": "wrangler dev --local --persist-to ../../.wrangler-persist --ip 0.0.0.0 --port 8788"
}
```

**教訓**: wranglerはデフォルトで動的ポート割り当てするため、E2Eテストが接続失敗する。**必ず `--port` オプションでポート固定する**。

#### データベース永続化設定

```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "ptdev"
database_id = "dummy-local-id"
```

```bash
# マイグレーション実行
wrangler d1 migrations apply ptdev --local --persist-to ../../.wrangler-persist
```

**教訓**: `--persist-to` オプションでデータベースファイルの位置を明示的に指定。これによりDocker環境でのデータベース共有が可能。

### 2. pnpmワークスペース構成

#### 基本構造

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

```json
// package.json（ルート）
{
  "scripts": {
    "dev": "pnpm build && pnpm --filter wrangler dev",
    "test:e2e:docker": "docker-compose up e2e-test --build"
  }
}
```

#### パッケージ依存関係

```json
// packages/wrangler/package.json
{
  "dependencies": {
    "@pnpm-e2e/core": "workspace:*"
  }
}
```

**教訓**: ワークスペース間の依存は `workspace:*` を使用。ビルド順序を考慮して、coreパッケージを先にビルドする。

### 3. Dockerマルチサービス構成

#### docker-compose.yml設計

```yaml
services:
  # Webアプリケーション
  web:
    build:
      context: .
      dockerfile: packages/wrangler/Dockerfile
    ports:
      - "8788:8788"
    volumes:
      - ./.wrangler-persist:/app/.wrangler-persist
    networks:
      - e2e-network

  # E2Eテスト
  e2e-test:
    build:
      context: .
      dockerfile: packages/wrangler-e2e/Dockerfile
    depends_on:
      - web
    environment:
      - PLAYWRIGHT_BASE_URL=http://web:8788
    networks:
      - e2e-network
    command: ["pnpm", "test:docker"]

networks:
  e2e-network:
    driver: bridge
```

**教訓**:

- サービス間通信は内部ネットワーク名（`web:8788`）を使用
- `depends_on` でサービス起動順序を制御
- 永続化ディレクトリはvolume mountで共有

### 4. Playwright設定

#### playwright.config.ts

```typescript
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,    // 順次実行
  workers: 1,              // ワーカー数1
  timeout: 60000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8787",
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], headless: true } },
    { name: "firefox", use: { ...devices["Desktop Firefox"], headless: true } },
    { name: "webkit", use: { ...devices["Desktop Safari"], headless: true } },
  ],
});
```

**教訓**:

- **データベース共有問題により並列実行は断念**。安定性優先で順次実行を採用
- 環境変数でbaseURLを切り替え（ローカル/Docker対応）
- マルチブラウザテストでクロスブラウザ互換性を確保

#### テストでのデータベースリセット

```typescript
// tests/numbers.spec.ts
test.beforeEach(async () => {
  const isDocker = process.env.NODE_ENV === "test" && process.cwd().startsWith("/app");
  const webDir = isDocker ? "/app/packages/wrangler" : "../wrangler";
  const resetSqlPath = "../wrangler-e2e/reset.sql";
  const wranglerCommand = isDocker ? "wrangler" : "pnpm wrangler";

  execSync(
    `${wranglerCommand} d1 execute ptdev --local --file=${resetSqlPath} --persist-to ../../.wrangler-persist`,
    { stdio: "pipe", cwd: webDir }
  );
});
```

**教訓**:

- 各テスト前にデータベースを完全リセット
- Docker/ローカル環境の自動判定
- パス指定の環境差分を適切に処理

### 5. 発生した問題と解決策

#### 問題1: wrangler起動障害

**現象**: `vite build`で不要な`index.html`を要求されるエラー

```bash
Error: Could not resolve entry module "index.html"
```

**解決**: package.jsonのbuildスクリプト修正

```json
{
  "scripts": {
    "build": "tsc --noEmit"  // vite buildから変更
  }
}
```

#### 問題2: E2Eテスト接続障害

**現象**: wranglerの動的ポート割り当てによる接続失敗

**解決**: ポート固定化

```bash
wrangler dev --port 8787  # 必須オプション
```

#### 問題3: TypeScript型エラー

**現象**: HonoXとCloudflareプラグインのViteバージョン不整合

**解決**: 一時的な型エラー回避

```typescript
// @ts-ignore - ViteバージョンとHonoXの互換性問題の回避
import { createRoute } from 'honox/server';
```

#### 問題4: Docker環境のパス不整合

**現象**: パッケージ名変更がDockerfileに未反映

**解決**: 全Dockerfile内のパス参照を統一

```dockerfile
COPY packages/wrangler/package.json ./packages/wrangler/
WORKDIR /app/packages/wrangler
```

## 実装手順

### ステップ1: プロジェクト基盤

```bash
# 1. pnpmワークスペース初期化
mkdir project-name && cd project-name
pnpm init
echo 'packages:\n  - "packages/*"' > pnpm-workspace.yaml

# 2. TypeScript + Biome設定
pnpm add -D typescript @biomejs/biome
npx tsc --init --strict
echo '{"formatter": {"enabled": true}}' > biome.json

# 3. パッケージ構造作成
mkdir -p packages/{core,wrangler,wrangler-e2e,dkit}
```

### ステップ2: アプリケーション実装

```bash
# 1. coreパッケージ（共通ロジック）
cd packages/core
pnpm init
pnpm add drizzle-orm @libsql/client
pnpm add -D drizzle-kit

# 2. wranglerパッケージ（HonoXアプリ）
cd ../wrangler
pnpm init
pnpm add hono honox @hono/vite-cloudflare-pages
pnpm add -D wrangler @cloudflare/workers-types vite concurrently
```

### ステップ3: E2Eテスト設定

```bash
# 1. E2Eテストパッケージ
cd ../wrangler-e2e
pnpm init
pnpm add -D @playwright/test

# 2. Playwright設定
npx playwright install
# playwright.config.ts作成（上記設定参照）

# 3. テスト実装
mkdir tests
# tests/numbers.spec.ts作成
```

### ステップ4: Docker環境構築

```bash
# 1. Dockerfileの作成
# packages/wrangler/Dockerfile
# packages/wrangler-e2e/Dockerfile

# 2. docker-compose.yml作成（上記設定参照）

# 3. テスト実行
docker-compose up e2e-test --build
```

## 品質チェック体系

### プロジェクトレベル

```json
{
  "scripts": {
    "clean:build": "rm -rf packages/*/dist packages/*/.cache",
    "lint:fix": "biome check . --fix --diagnostic-level=error",
    "lint": "biome check .",
    "build": "pnpm -r --filter './packages/*' build",
    "typecheck": "pnpm -r --filter './packages/*' typecheck",
    "check": "pnpm clean:build && pnpm lint:fix && pnpm lint && pnpm build && pnpm typecheck"
  }
}
```

### パッケージレベル

```json
{
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "lint": "biome check . --diagnostic-level=error",
    "lint:fix": "biome check . --fix --diagnostic-level=error"
  }
}
```

## パフォーマンス最適化

### 1. Docker Build最適化

```dockerfile
# 依存関係のキャッシュ活用
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/*/
RUN pnpm install --frozen-lockfile

# プロジェクトファイルコピー（.dockerignore活用）
COPY . .
```

### 2. E2Eテスト最適化

- **順次実行**: データベース分離問題により並列実行を断念
- **マルチブラウザ**: 3ブラウザ × 7テスト = 21テスト実行
- **実行時間**: 約37秒（Docker環境）

## 運用上の注意点

### 1. ポート管理

- **ローカル**: 8787ポート固定
- **Docker**: 8788ポート（外部公開用）
- **内部通信**: `web:8788`（サービス名:ポート）

### 2. データベース管理

- **永続化**: `.wrangler-persist`ディレクトリ
- **リセット**: 各テスト前に`reset.sql`実行
- **マイグレーション**: `wrangler d1 migrations apply`

### 3. 環境変数

```bash
# Docker環境
NODE_ENV=test
PLAYWRIGHT_BASE_URL=http://web:8788

# ローカル環境
PLAYWRIGHT_BASE_URL=http://localhost:8787
```

## 成果指標

- ✅ **21/21テスト成功**: Chromium(7) + Firefox(7) + WebKit(7)
- ✅ **実行時間**: 37.3秒（Docker環境）
- ✅ **データベース完全分離**: テスト間独立性確保
- ✅ **クロスプラットフォーム**: macOS開発 + Linux Docker
- ✅ **品質チェック**: `pnpm check`で全パッケージ統合チェック

## トラブルシューティング

### よくある問題

1. **wrangler起動失敗**: `--port`オプション確認
2. **E2E接続エラー**: baseURL設定とポート番号確認
3. **ビルドエラー**: 依存関係とワークスペース設定確認
4. **型エラー**: TypeScript設定とパッケージバージョン確認

### デバッグ手順

```bash
# 1. 個別パッケージ確認
cd packages/wrangler && pnpm dev

# 2. E2Eテスト単体実行
cd packages/wrangler-e2e && pnpm test

# 3. Docker環境デバッグ
docker-compose up web  # Webサービスのみ起動
docker-compose logs e2e-test  # E2Eテストのログ確認
```

## まとめ

このガイドは、**pnpm + wrangler + Docker + E2E**の組み合わせで安定した開発環境を構築するための実戦的なノウハウをまとめています。特に：

1. **ポート固定化**: wranglerの動的ポート割り当て問題への対処
2. **データベース分離**: テスト間の完全独立性確保
3. **Docker化**: クロスプラットフォーム対応とCI/CD準備
4. **品質管理**: 統合的なチェック体系の構築

これらの知見により、他のwranglerサービスでも同様の安定したE2E環境を短期間で構築可能です。
