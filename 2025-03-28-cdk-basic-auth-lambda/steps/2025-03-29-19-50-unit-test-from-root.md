# 単体テストをルートから実行できるようにする

## 概要

プロジェクトルートから各パッケージの単体テストを実行できるように設定を追加しました。これにより、開発者は特定のパッケージのテストだけを実行したり、テストカバレッジを確認したりすることが容易になります。

## 変更内容

### 1. ルートの package.json に単体テスト用のスクリプトを追加

```json
"# === 単体テストコマンド ===": "",
"test:unit": "pnpm -r test",
"test:unit:aws-utils": "pnpm --filter aws-utils test",
"test:unit:integration-tests": "pnpm --filter integration-tests test",
"test:unit:cbal": "pnpm --filter cbal test",
"test:unit:watch": "pnpm -r test:watch",
"test:unit:aws-utils:watch": "pnpm --filter aws-utils test:watch",
"test:unit:integration-tests:watch": "pnpm --filter integration-tests test:watch",
"test:unit:coverage": "pnpm -r test:coverage",
"test:unit:aws-utils:coverage": "pnpm --filter aws-utils test:coverage",
"test:unit:integration-tests:coverage": "pnpm --filter integration-tests test:coverage",
```

### 2. aws-utils パッケージにカバレッジ用のスクリプトを追加

```json
"test:coverage": "vitest run --coverage"
```

### 3. aws-utils パッケージの vitest.config.ts にカバレッジ設定を追加

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  exclude: ['node_modules/', 'dist/'],
},
```

### 4. integration-tests パッケージにカバレッジ用のスクリプトを追加

```json
"test:coverage": "vitest run --coverage",
"test:coverage:local": "NODE_ENV=local vitest run --coverage",
"test:coverage:dev": "NODE_ENV=development vitest run --coverage",
"test:coverage:prod": "NODE_ENV=production vitest run --coverage",
```

### 5. README.md にテストの実行方法に関するドキュメントを追加

単体テストと結合テストの実行方法を詳細に記載しました。

## 使用方法

### 単体テスト

```bash
# 全パッケージの単体テストを実行
pnpm test:unit

# 特定のパッケージの単体テストを実行
pnpm test:unit:aws-utils
pnpm test:unit:integration-tests
pnpm test:unit:cbal

# ウォッチモードで単体テストを実行
pnpm test:unit:watch
pnpm test:unit:aws-utils:watch
pnpm test:unit:integration-tests:watch

# カバレッジレポート付きで単体テストを実行
pnpm test:unit:coverage
pnpm test:unit:aws-utils:coverage
pnpm test:unit:integration-tests:coverage
```

### 結合テスト

```bash
# ローカル環境での結合テスト
pnpm test:integration:local

# 開発環境での結合テスト
pnpm test:integration:dev

# 本番環境での結合テスト
pnpm test:integration:prod
```

## 確認事項

- [x] ルートから `pnpm test:unit` コマンドで全パッケージの単体テストが実行できること
- [x] ルートから `pnpm test:unit:aws-utils` などのコマンドで特定のパッケージの単体テストが実行できること
- [x] ルートから `pnpm test:unit:coverage` などのコマンドでテストカバレッジが表示されること
- [x] README.md にテストの実行方法が記載されていること
