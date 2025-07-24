# AWS Lambda SQLite with EFS 実装タスク

作成日時: 2025-07-24

## 概要

AWSでEFSを利用してSQLiteを使用する実験的実装。DynamoDBとのパフォーマンス比較を行う。

### ⚠️ 技術的制約の確認結果

**SQLite + EFS の問題点**:

- **パフォーマンス**: EFS経由のSQLite操作は64ms vs /tmp利用時の517μs（約120倍遅い）
- **同時アクセス**: WALモードはNFS系ファイルシステム（EFS）で正常動作せず
- **ロック問題**: 複数Lambda間での同時書き込みでデータベース破損リスク

**検証方針の変更**:

- EFS + SQLite（読み取り専用）
- /tmp + SQLite（読み取り専用、初期化時にEFSからコピー）
- DynamoDBとの比較

## プルリクエスト

URL: <https://github.com/phasetr/pt-javascript/pull/2>

## 技術スタック

- **インフラ**: AWS CDK (Node.js)
- **API**: Hono (Lambda上で動作)
- **SQLite ORM**: drizzle
- **比較用NoSQL**: DynamoDB
- **ファイルシステム**: EFS (SQLiteファイル保存用)

## アーキテクチャ設計

### シンプルなAWSインフラ確認

- **目的**: EFS + SQLite構成の動作確認
- **比較**: DynamoDBとのパフォーマンス比較
- **テスト**: CDK含むしっかりしたテスト実装

### プロジェクト構造（pnpm workspace）

```text
├── packages/
│   ├── api/           # Lambda API（Hono）
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── test/  # index.ts等のテスト
│   │   │   └── handlers/
│   │   │       ├── insert.ts
│   │   │       └── test/  # handlers/のテスト
│   │   └── package.json
│   ├── console/       # データ投入用コンソールアプリ
│   │   ├── src/
│   │   │   ├── cli.ts
│   │   │   └── test/  # cli.ts等のテスト
│   │   └── package.json
│   └── cdk/           # AWS CDKインフラ定義
│       ├── lib/
│       │   ├── stack.ts
│       │   └── test/  # stack.ts等のテスト
│       └── package.json
├── docs/              # ドキュメント
├── package.json       # ワークスペース設定
└── pnpm-workspace.yaml
```

## API設計

### エンドポイント仕様

1. **POST /insert** - DynamoDBにデータ投入 + SQLiteファイル再生成
2. **GET /sqlite-efs** - EFS上のSQLiteから読み出し
3. **GET /sqlite-tmp** - /tmp上のSQLiteから読み出し（EFSからコピー）
4. **GET /ddb** - DynamoDBからの読み出し

### データモデル

```typescript
type RandomData = {
  readonly id: string;          // ULID
  readonly random_value: number; // Math.random()生成値
  readonly created_at: string;   // ISO string
};
```

## タスク分解

### フェーズ1: プロジェクト基盤構築

1. **pnpm workspace初期化**
   - pnpm-workspace.yaml設定
   - packages/api、console、cdk構成
   - TypeScript、biome設定

2. **データ投入コンソールアプリ**
   - ランダムデータ生成・投入機能
   - `pnpm console:seed`コマンド対応

**評価項目**:

- [ ] `pnpm lint && pnpm build && pnpm test`が無エラー完了

### フェーズ2: Lambda API実装

1. **Hono API実装**
   - 4つのエンドポイント（insert, sqlite-efs, sqlite-tmp, ddb）
   - randomsテーブル（drizzle schema）
   - DynamoDB操作

**評価項目**:

- [ ] 単体テスト100%カバレッジ
- [ ] ローカルでの動作確認

### フェーズ3: AWS CDK実装

1. **CDKインフラ定義**
   - Lambda関数設定
   - EFS設定とマウント
   - DynamoDB randomsテーブル
   - API Gateway設定

**評価項目**:

- [ ] CDKのテスト実装
- [ ] `cdk synth`が成功
- [ ] `cdk deploy`でリソース作成成功

### フェーズ4: 動作確認

1. **実際のAWS環境テスト**
   - コンソールアプリでのデータ投入
   - EFS vs /tmp vs DynamoDBパフォーマンス比較

**評価項目**:

- [ ] 全エンドポイントの動作確認
- [ ] パフォーマンステスト結果取得

## 開発方針

### テスト重視の開発

- **CDK含むテスト**: インフラもしっかりテスト
- **テストカバレッジ**: 原則100%
- **型安全性**: `any`の使用厳禁
- **シンプル実装**: 複雑な抽象化は避ける

## 次のステップ

ユーザーに作業計画の確認を求めます。指摘・修正があれば対応してから実装開始します。

## コマンド設計

**プロジェクトルートから実行可能**:

- `pnpm console:seed` - ランダムデータを投入
- `pnpm console:seed --count 1000` - 1000件のランダムデータ投入
- `pnpm cdk:deploy` - CDKデプロイ
- `pnpm api:dev` - ローカル開発サーバー

## 作業状況

- [x] 作業ブランチ作成 (`feat/aws-lambda-sqlite-with-efs`)
- [x] 空コミット + プッシュ完了
- [x] プルリクエスト作成完了（<https://github.com/phasetr/pt-javascript/pull/2>）
- [x] 作業計画書更新完了（pnpm workspace + コンソールアプリ対応）

作業計画についてご確認をお願いします。修正・追加のご指摘があれば対応してから実装を開始します。
