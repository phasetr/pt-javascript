# AWS Lambda SQLite with EFS 実験プロジェクト

AWSでEFSを利用してSQLiteを使用する実験的実装。DynamoDBとのパフォーマンス比較を行う。

## プロジェクト構成

```
packages/
├── api/           # Lambda API（Hono）
├── console/       # データ投入用コンソールアプリ
├── benchmark/     # ベンチマーク実行用アプリ
└── cdk/          # AWS CDKインフラ定義
```

## 必要条件

- Node.js 20以上
- pnpm 9以上
- AWS CLI設定済み
- AWS CDKインストール済み

## セットアップ

```bash
# 依存関係のインストール
pnpm install

# 全パッケージのビルド
pnpm build
```

## デプロイ

```bash
# Lambda用ZIPファイルをビルドしてデプロイ
pnpm cdk:deploy

# 承認なしで強制デプロイ
pnpm cdk:deploy:force
```

## API エンドポイント

- `GET /health` - ヘルスチェック
- `GET /ddb` - DynamoDBからの読み出し
- `GET /sqlite-efs` - EFS上のSQLiteから読み出し
- `GET /sqlite-tmp` - /tmp上のSQLiteから読み出し
- `POST /insert` - DynamoDBにデータ投入

## 開発コマンド

### プロジェクトルートから実行可能

```bash
# リンター実行
pnpm lint:fix

# テスト実行
pnpm test:dev

# 全体チェック（リント、ビルド、型チェック、テスト）
pnpm check

# Lambda ZIPファイルのみビルド
pnpm build:lambda

# APIのローカル開発サーバー
pnpm api:dev

# コンソールアプリでデータ投入
pnpm console:seed --count 1000

# ベンチマーク実行
pnpm benchmark:run
```

### デプロイ関連

```bash
# CDKスタックのデプロイ（Lambda ZIPビルド含む）
pnpm cdk:deploy

# 承認なしで強制デプロイ
pnpm cdk:deploy:force

# スタックの削除
pnpm cdk:destroy
```

### AWS CLI でのデプロイ結果確認

```bash
# API URLの取得
aws cloudformation describe-stacks \
  --stack-name aws-lambda-sqlite-efs-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text

# 全出力を表形式で確認
aws cloudformation describe-stacks \
  --stack-name aws-lambda-sqlite-efs-stack \
  --query 'Stacks[0].Outputs' \
  --output table
```

## 技術的な詳細

### Lambda デプロイの仕組み

1. `scripts/build-lambda.sh` が Lambda 用の ZIP ファイルを作成
2. TypeScript をビルドして dist/ に出力
3. ESモジュール対応の package.json を生成
4. 必要な依存関係を含めた ZIP ファイルを作成
5. CDK が ZIP ファイルを Lambda にデプロイ

### 注意事項

- Lambda は Hono の AWS Lambda アダプター (`hono/aws-lambda`) を使用
- ESモジュール形式で動作（package.json に `"type": "module"` が必要）
- 開発用依存関係は ZIP ファイルから除外される