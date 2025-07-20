# S3Vectors RAG System (TypeScript版)

Amazon S3Vectors、Bedrock、CDKを使用したRAG（Retrieval-Augmented Generation）システムの完全TypeScript実装

## 概要

メイドインアビス関連情報を検索可能なAIシステム。Python版からTypeScript版への完全移植を実現。
全パッケージでコマンドライン引数ベースの純粋関数実装を採用し、環境変数依存を排除。

- **参考記事**: [Amazon S3 Vectorsで激安RAGシステムを構築する](https://zenn.dev/tosuri13/articles/c7ac9477d28c19)
- **オリジナル**: [Pythonでのオリジナルリポジトリ](https://github.com/tosuri13/madeinabyss-s3vectors-search)

## アーキテクチャ

```text
packages/
├── cdk/                    # CDKインフラ定義
├── lambda/                 # API Gateway + Lambda関数
├── load-source/            # Wikipedia取得ツール
├── add-vectors/            # ベクターデータ投入ツール  
├── create-s3vectors-index/ # S3Vectorsインデックス作成ツール
└── query-api/              # API クエリ実行ツール（TypeScript版）
```

## 前提条件

- **Node.js** 18+ インストール済み
- **AWS CLI** 設定済み（us-east-1リージョン）
- **pnpm** インストール済み（`npm install -g pnpm`）
- **AWS CDK CLI** インストール済み（`npm install -g aws-cdk`）

## 環境構築手順

### 1. Bedrockモデルアクセス申請（必須）

**AWS コンソールから手動申請：**

1. AWS Console > Amazon Bedrock > Model access
2. 以下のモデルアクセスを申請：
   - `amazon.titan-embed-text-v2:0` (Titan Text Embeddings V2)
   - `anthropic.claude-3-5-sonnet-20240620-v1:0` (Claude 3.5 Sonnet)
3. 申請承認まで待機（通常数分〜数時間）

### 2. プロジェクトセットアップ

```bash
# リポジトリクローン
git clone <repository-url>
cd s3-vectors-rag

# 依存関係インストール
pnpm install

# 全パッケージビルド
pnpm build
```

### 3. インフラデプロイ

```bash
# CDKデプロイ（自動承認）
pnpm --filter cdk run deploy
```

### 4. S3Vectorsインデックス作成

```bash
# デプロイ後にS3バケット名を取得
VECTOR_BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name MadeinabyssS3VectorsRagTypeScriptStack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`VectorBucketName`].OutputValue' \
  --output text)

echo ${VECTOR_BUCKET_NAME}

# S3Vectorsバケット・インデックス作成（コマンドライン引数使用）
pnpm --filter create-s3vectors-index start \
  --bucket-name "$VECTOR_BUCKET_NAME" \
  --index-name "madeinabyss-s3vectors-search-index" \
  --dimension 1024 \
  --distance-metric euclidean
```

**引数詳細:**

- `--bucket-name`: S3Vectorsバケット名（必須）
- `--index-name`: インデックス名（デフォルト: madeinabyss-s3vectors-search-index）
- `--dimension`: ベクター次元数（デフォルト: 1024）
- `--distance-metric`: 距離メトリック（euclidean/cosine、デフォルト: euclidean）

## データ投入・RAG検索実行

### 5. Wikipediaデータ取得

```bash
# メイドインアビスの記事取得（デフォルト値使用）
pnpm --filter load-source start
```

### 6. ベクターデータ投入

```bash
# バケット名を再取得（前のセクションで設定済みの場合は不要）
VECTOR_BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name MadeinabyssS3VectorsRagTypeScriptStack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`VectorBucketName`].OutputValue' \
  --output text)

echo ${VECTOR_BUCKET_NAME}

# ベクターデータ作成・投入（必須引数のみ指定）
pnpm --filter add-vectors start \
  --bucket-name "$VECTOR_BUCKET_NAME"
```

### 7. API動作確認

```bash
# API テスト実行
pnpm --filter query-api start "メイドインアビスとは何ですか？"

# JSON出力を見やすく整形（pnpmメタデータを除去してjq使用）
pnpm --filter query-api start "メイドインアビスとは何ですか？" 2>/dev/null | tail -n 1 | jq

# 回答部分のみ抽出
pnpm --filter query-api start "メイドインアビスとは何ですか？" 2>/dev/null | tail -n 1 | jq -r '.answer'
```

### 期待される結果

正常に動作すると以下のようなJSONレスポンスが返される：

```json
{
  "answer": "メイドインアビスは、つくしあきひと作の漫画作品です。ジャンルはダークファンタジーアドベンチャーに分類されます。..."
}
```

## 環境削除手順

### 1. CDKスタック削除

```bash
# CDKスタック削除
pnpm --filter cdk run destroy

# 確認
aws cloudformation describe-stacks --stack-name MadeinabyssS3VectorsRagTypeScriptStack || echo "Stack deleted successfully"

# S3Vectorsバケットが残っている場合は手動削除
aws s3 ls | grep madeinabysss3vectorsragtypesc | awk '{print $3}' | while read bucket; do
  if [ -n "$bucket" ]; then
    echo "Deleting bucket: $bucket"
    aws s3 rb s3://$bucket --force
  fi
done
```

### 2. ローカルファイル削除

```bash
# 生成されたファイル削除
rm -rf assets/
rm -rf packages/*/dist/
rm -rf node_modules/
rm -rf packages/*/node_modules/
```

## 開発・ビルド

### テスト実行

```bash
# 全パッケージテスト
pnpm test

# 個別パッケージテスト
pnpm --filter create-s3vectors-index test
pnpm --filter add-vectors test
pnpm --filter load-source test
pnpm --filter query-api test
```

### ビルド

```bash
# 全パッケージビルド
pnpm build

# Lint修正
pnpm lint:fix
```

### 品質確認

```bash
# 総合品質確認
pnpm clean:build
pnpm lint:fix && pnpm lint && pnpm typecheck && pnpm test
```

## トラブルシューティング

### よくある問題

1. **Bedrock AccessDenied**
   - AWS Consoleでモデルアクセス申請が必要
   - us-east-1リージョンで実行

2. **S3Vectors NotFound**
   - create-s3vectors-indexパッケージでインデックス作成
   - バケット名・インデックス名の引数確認

3. **メタデータサイズ制限**
   - S3Vectorsメタデータは2048バイト制限
   - テキストは500バイトに自動制限済み

4. **Lambda Timeout**
   - 現在301秒に設定済み
   - 大量データ投入時は分割実行を検討

### ログ確認

```bash
# CloudWatch Logsでエラー確認
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/madeinabyss

# 最新ログストリーム確認
aws logs describe-log-streams \
  --log-group-name /aws/lambda/madeinabyss-s3vectors-search-function-cdk \
  --order-by LastEventTime --descending --max-items 1
```

## 技術スタック

- **Infrastructure**: AWS CDK (TypeScript)
- **Compute**: AWS Lambda (Node.js 18)
- **Vector Database**: Amazon S3Vectors
- **AI Models**: Amazon Bedrock (Titan Embeddings V2, Claude 3.5 Sonnet)
- **Framework**: LangChain TypeScript
- **Build Tools**: pnpm workspace, esbuild, vitest
- **Code Quality**: Biome (lint/format)
- **Architecture**: 純粋関数 + コマンドライン引数ベース + t-wada way TDD

## ライセンス

このプロジェクトはオリジナルのPythonリポジトリをTypeScriptに移植したものです。
