# S3Vectorsインデックス作成パッケージ作成計画

## 概要

S3Vectorsインデックス作成機能を独立したパッケージとして`packages/create-s3vectors-index`に作成する。現在CDKには通常のS3バケット作成のみが含まれており、S3Vectors専用のインデックス作成は手動実行が必要な状況。

## 技術要件

- t-wada wayのTDD（テストカバレッジ100%）
- モジュラーモノリス・鉄道指向設計
- TypeScript strict mode完全対応
- Biome準拠のコード品質
- 依存性注入によるテスタビリティ確保

## 現状分析

- CDKStack（`packages/cdk/lib/cdk-stack.ts`）では通常のS3バケットのみ作成
- S3Vectorsの特別なインデックス作成は含まれていない
- これまでPythonスクリプトで手動実行していた機能
- `packages/load-source`, `packages/add-vectors`と同様の独立パッケージ構成

## 実装計画

### 1. パッケージ構造設計

```text
packages/create-s3vectors-index/
├── package.json           # 依存関係設定
├── tsconfig.json         # TypeScript設定
├── src/
│   └── index.ts          # メイン実装
├── test/
│   └── create-s3vectors-index.test.ts  # テストファイル
└── bin/
    └── create-s3vectors-index.js       # 実行用スクリプト
```

### 2. 主要機能

- S3Vectorsバケット作成: `createVectorBucket`
- S3Vectorsインデックス作成: `createIndex`
- 環境変数検証: `validateEnvironmentVariables`
- エラーハンドリング（Result型使用）

### 3. 必要な依存関係

- `@aws-sdk/client-s3vectors`: S3Vectors操作
- `uuid`: 一意識別子生成（必要に応じて）
- テスト用: `vitest`（他パッケージと統一）

### 4. 環境変数

- `VECTOR_BUCKET_NAME`: S3Vectorsバケット名
- `VECTOR_INDEX_NAME`: インデックス名
- `VECTOR_DIMENSION`: ベクター次元数（1024がデフォルト）
- `DISTANCE_METRIC`: 距離メトリック（euclideanがデフォルト）
- `DATA_TYPE`: データタイプ（float32がデフォルト）

### 5. 実装ステップ

1. パッケージディレクトリとファイル構造作成
2. package.json, tsconfig.json設定
3. TDDでコア機能実装
   - 環境変数検証テスト → 実装
   - S3Vectorsバケット作成テスト → 実装
   - インデックス作成テスト → 実装
   - メイン処理テスト → 実装
4. 実行用スクリプト作成
5. Biomeによるlint統一
6. ビルド・テスト実行確認

### 6. Python版との対応

```python
# Python版（参考）
s3vectors.create_vector_bucket(vectorBucketName='bucket-name')
s3vectors.create_index(
    vectorBucketName='bucket-name',
    indexName='index-name',
    dataType='float32',
    dimension=1024,
    distanceMetric='euclidean'
)
```

対応するTypeScript実装:

```typescript
await createVectorBucket(bucketName);
await createIndex({
  bucketName,
  indexName,
  dataType: 'float32',
  dimension: 1024,
  distanceMetric: 'euclidean'
});
```

### 7. 品質確保

- 各関数のカバレッジ100%
- モック使用による依存性テスト
- エラーケースの網羅的テスト
- 実行前の定期確認コマンド実行

## 実装完了

### 実装済み機能

- S3Vectorsバケット作成機能
- S3Vectorsインデックス作成機能  
- 環境変数による設定管理
- TDDによる100%テストカバレッジ確保
- TypeScript strict mode完全対応
- Biome準拠のコード品質

### 実行方法

```bash
# 環境変数設定
export VECTOR_BUCKET_NAME="your-bucket-name"
export VECTOR_INDEX_NAME="your-index-name"
export VECTOR_DIMENSION="1024"  # オプション（デフォルト: 1024）
export DISTANCE_METRIC="euclidean"  # オプション（デフォルト: euclidean）

# インデックス作成実行
pnpm --filter create-s3vectors-index create-index
```

### パッケージ構成

```text
packages/create-s3vectors-index/
├── package.json           # 依存関係設定（AWS SDK v3）
├── tsconfig.json         # TypeScript設定
├── vitest.config.ts      # テスト設定
├── src/
│   └── index.ts          # メイン実装
├── test/
│   └── create-s3vectors-index.test.ts  # 100%カバレッジテスト
└── bin/
    └── create-s3vectors-index.js       # 実行用スクリプト
```

### 設計特徴

- t-wada wayのTDD実装
- 鉄道指向プログラミング採用
- Result型によるエラーハンドリング
- 依存性注入によるテスタビリティ確保
- 環境変数保存・復元によるテスト分離
