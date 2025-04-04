# CSMWF (Cloudflare SQS Mail With Files) マニュアル

このマニュアルでは、CSMWF（Cloudflare SQS Mail With Files）プロジェクトのローカル開発環境の設定、デプロイ方法、テスト方法、環境削除方法について説明します。

## 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [前提条件](#前提条件)
3. [ローカル開発環境のセットアップ](#ローカル開発環境のセットアップ)
4. [AWS CDKのデプロイ](#aws-cdkのデプロイ)
5. [Cloudflare Workersのデプロイ](#cloudflare-workersのデプロイ)
6. [テスト方法](#テスト方法)
7. [環境削除方法](#環境削除方法)
8. [トラブルシューティング](#トラブルシューティング)

## プロジェクト概要

CSMWFは、CloudflareからAWS SESを利用してメール送信を行うためのプロジェクトです。CloudflareからAWS SDKが直接利用するのが簡単ではないため、SQSをキューイングサービスとして利用し、Lambdaを経由してSESでメール送信を行います。

主な構成要素：

- Cloudflare Workers（Honoフレームワーク）：APIエンドポイントを提供
- AWS SQS：メッセージキューイング
- AWS Lambda：SQSからメッセージを受け取り、SESでメール送信
- AWS SES：メール送信サービス

## 前提条件

- Node.js 18以上
- pnpm 8以上
- AWS CLI（設定済み）
- AWS CDK CLI
- Wrangler CLI（Cloudflare Workers用）
- AWS SESで検証済みのメールアドレス

## ローカル開発環境のセットアップ

### 1. リポジトリのクローンと依存関係のインストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd cf-sqs-mail-with-files

# 依存関係のインストール
pnpm install
```

### 2. 環境変数の設定

AWS認証情報を環境変数として設定します：

```bash
# AWS認証情報
export AWS_ACCESS_KEY_ID=<your-access-key>
export AWS_SECRET_ACCESS_KEY=<your-secret-key>
export AWS_REGION=ap-northeast-1  # 使用するリージョン
```

### 3. Honoアプリケーションのローカル開発環境設定

`.dev.vars`ファイルを作成します：

```bash
cd packages/hono-api
cp .dev.vars.sample .dev.vars
```

`.dev.vars`ファイルを編集して、AWS認証情報とSQSキューURLを設定します：

```txt
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_REGION=ap-northeast-1
SQS_QUEUE_URL=<your-sqs-queue-url>  # CDKデプロイ後に取得
```

### 4. Lambda関数の設定

`packages/csmwf/lambda/email-sender.ts`ファイルを編集して、送信元・送信先メールアドレスを設定します：

```typescript
// 送信元・送信先メールアドレス
// 注: 実際の運用では環境変数やSecretsManagerから取得するべき
const sourceEmail = "your-verified-email@example.com"; // SESで検証済みのアドレスが必要
const destinationEmail = "recipient@example.com"; // 送信先アドレス
```

### 5. ローカル開発サーバーの起動

#### 通常の起動方法

```bash
# プロジェクトルートディレクトリで実行
pnpm run dev:hono
```

これにより、Honoアプリケーションがローカルで起動し、`http://localhost:<some-port>`でアクセスできるようになります。`wrangler dev --port 3000`のように起動すればポート指定で起動できます。今回はこれを仮定していません。（以後の開発ではこの固定を前提にする予定です。）

#### PM2を使用したバックグラウンド起動

プロジェクトにはPM2を使用したバックグラウンド実行のための設定が含まれています。以下のコマンドを使用して、サービスを管理できます：

```bash
# サービスの起動
pnpm run start

# サービスの停止
pnpm run stop

# サービスの再起動
pnpm run restart

# サービスのステータス確認
pnpm run status

# ログの確認
pnpm run logs
```

これにより、ターミナルを閉じてもバックグラウンドでサービスが実行され続けます。

## AWS CDKのデプロイ

### 1. CDKブートストラップ（初回のみ）

```bash
cd packages/csmwf
pnpm run cdk bootstrap
```

### 2. CDKデプロイ

```bash
# プロジェクトルートディレクトリで実行
pnpm run deploy:cdk
```

または：

```bash
cd packages/csmwf
pnpm run cdk deploy
```

### 3. SQSキューURLの取得

デプロイ後、SQSキューURLを取得します：

```bash
# プロジェクトルートディレクトリで実行
pnpm run get:queue-url
```

この出力されたURLを`.dev.vars`ファイルの`SQS_QUEUE_URL`に設定します。

## Cloudflare Workersのデプロイ

### 1. Wranglerの認証

```bash
wrangler login
```

### 2. シークレットの設定

```bash
cd packages/hono-api

# AWS認証情報とリージョンの設定
wrangler secret put AWS_ACCESS_KEY_ID
wrangler secret put AWS_SECRET_ACCESS_KEY
wrangler secret put AWS_REGION

# SQSキューURLの設定
wrangler secret put SQS_QUEUE_URL
```

各コマンド実行時に、対応する値の入力を求められます。

### 3. Workersのデプロイ

```bash
# プロジェクトルートディレクトリで実行
pnpm run deploy:hono
```

または：

```bash
cd packages/hono-api
pnpm run deploy
```

デプロイが完了すると、Workersのエンドポイント（例：`https://csmwf-api.your-subdomain.workers.dev`）が表示されます。

## テスト方法

### 1. テスト用データの準備

プロジェクトには、テスト用の会話データ（約200KB）が`data/client-server-conversation.txt`に含まれています。

### 2. SQS直接送信テスト

AWS SDKを使用してSQSに直接メッセージを送信し、Lambda関数がメールを送信するかテストします：

```bash
# プロジェクトルートディレクトリで実行
pnpm run test:sqs
```

特定のSQSキューURLを指定する場合：

```bash
pnpm run test:sqs "<your-sqs-queue-url>"
```

### 3. Honoアプリケーション経由のテスト

#### ローカル環境でのテスト

```bash
# ターミナル1: Honoアプリケーションを起動
pnpm run dev:hono

# ターミナル2: テストを実行、ポートは都度調べること
pnpm run test:hono "http://localhost:8787/message"
```

#### デプロイ済み環境でのテスト

```bash
pnpm run test:hono "https://csmwf-api.your-subdomain.workers.dev/message"
```

### 4. 一括テスト実行

ローカル環境でHonoアプリケーションが起動している状態で、SQS直接送信テストとHonoアプリケーション経由のテストを一括で実行できます：

```bash
# Honoアプリケーションを起動
pnpm run start

# 一括テスト実行
pnpm run test:all

# 完了後にアプリケーションを停止
pnpm run stop
```

このコマンドは、concurrentlyを使用して両方のテストを並行して実行します。

### 5. テスト結果の確認

1. コンソール出力でメッセージIDが表示されることを確認
2. AWS CloudWatchログでLambda関数の実行ログを確認
3. 指定したメールアドレスに添付ファイル付きのメールが届くことを確認

## 環境削除方法

### 1. Cloudflare Workersの削除

```bash
cd packages/hono-api
wrangler delete
```

確認を求められたら、`y`を入力します。

### 2. AWS CDKスタックの削除

```bash
# プロジェクトルートディレクトリで実行
pnpm run destroy:cdk
```

または：

```bash
cd packages/csmwf
pnpm run cdk destroy
```

確認を求められたら、`y`を入力します。

## トラブルシューティング

### SQSメッセージが処理されない

1. CloudWatchログでLambda関数のエラーを確認
2. Lambda関数のIAMロールがSQSとSESへのアクセス権限を持っているか確認
3. SQSキューのVisibility Timeoutが適切に設定されているか確認

### メールが送信されない

1. 送信元メールアドレスがSESで検証済みであることを確認
2. SESのサンドボックスモードを確認（初期状態では送信先も検証が必要）
3. CloudWatchログでSES関連のエラーを確認

### Cloudflare WorkersからSQSにアクセスできない

1. AWS認証情報（アクセスキー、シークレットキー）が正しく設定されているか確認
2. SQSキューURLが正しいか確認
3. IAMユーザーがSQSへのアクセス権限を持っているか確認
4. Wranglerのシークレットが正しく設定されているか確認

### その他の問題

- AWS CDKのデプロイエラー：`pnpm add -D esbuild`を実行してesbuildをインストール
- TypeScriptのコンパイルエラー：`pnpm install`を実行して依存関係を再インストール
- Wranglerのデプロイエラー：`wrangler whoami`で認証状態を確認し、必要に応じて`wrangler login`を再実行
