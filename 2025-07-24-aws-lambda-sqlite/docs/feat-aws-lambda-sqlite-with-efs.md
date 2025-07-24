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

- **EFS直接アクセス**: EFS上のSQLiteファイルに直接アクセス（ネットワークIO発生）
- **tmpコピー方式**: Lambda初期化時にEFS→/tmpにコピー、以降は/tmpから読み取り（初期化コスト vs 読み取り高速化）
  ⚠️ **ベンチマーク設計**: EFSとtmpで同一データを保証するため、各ベンチマーク実行前にtmpを削除してEFSから再コピー
- **DynamoDB**: 比較用ベースライン

**検証目的**:

- 初期化コスト（EFS→/tmpコピー時間）vs読み取り性能向上のトレードオフ
- Lambda実行時間・コスト効率の比較
- どの方式が実用的かの判定

**検証データ管理**:

- **データ生成**: コンソールアプリが初期データをDynamoDBに投入
- **SQLiteファイル生成**: Lambda内でDynamoDBデータを読み取り→SQLiteファイルをEFSに書き込み
- **個別測定**: 各APIエンドポイント実行時にレスポンス時間をDynamoDBに記録
- **自動ベンチマーク**: `/benchmark`が各エンドポイントを100回実行し統計を算出
- **結果参照**: `/benchmark/results`で過去測定データの一覧・分析結果を取得

**成功条件**:

- 「tmpコピー方式の初期化時間 < 100ms」かつ「読み取り性能 > EFS直接の10倍」
- または EFS直接でも十分な性能（< 50ms）であることの確認

## ベンチマークシナリオ設計

### 実行手順

#### 1. 初期データ投入

```bash
# 1000件のランダムデータを投入
pnpm console:seed --count 1000

# 10000件のランダムデータを投入（大量データ検証用）
pnpm console:seed --count 10000
```

#### 2. ベンチマーク実行

```bash
# 基本ベンチマーク（各エンドポイント100回実行）
# → docs/benchmarks/20250724-103000-benchmark.csv
# → docs/benchmarks/20250724-103000-benchmark.md 自動生成
pnpm benchmark:run

# カスタム回数ベンチマーク
pnpm benchmark:run --iterations 50

# 過去結果の確認
ls docs/benchmarks/
```

#### 3. 段階的検証シナリオ

**シナリオ1: 少量データ（1000件）での基本性能**

- データ投入: `pnpm console:seed --count 1000`
- ベンチマーク: `pnpm benchmark:run --iterations 100`
- 想定結果: 全エンドポイント < 100ms

**シナリオ2: 中量データ（10000件）でのスケーリング**

- データ投入: `pnpm console:seed --count 10000`
- ベンチマーク: `pnpm benchmark:run --iterations 100`
- 想定結果: EFS劣化、tmpコピー効果確認

**シナリオ3: 大量データ（100000件）での限界確認**

- データ投入: `pnpm console:seed --count 100000`
- ベンチマーク: `pnpm benchmark:run --iterations 50`
- 想定結果: 初期化コストvsクエリ性能のトレードオフ確認

### 結果ドキュメント生成

#### 自動ファイル出力

ベンチマーク実行時に以下ファイルが自動生成されます：

```text
docs/benchmarks/
├── 20250724-103000-benchmark.csv    # 生データ（CSV形式）
├── 20250724-103000-benchmark.md     # 分析レポート（Markdown）
├── 20250724-114500-benchmark.csv    # 2回目実行結果
├── 20250724-114500-benchmark.md
└── ...
```

**ファイル命名規則**: `YYYYMMDD-HHMMSS-benchmark.{csv,md}`

#### レポート内容構成

```markdown
# AWS Lambda SQLite vs DynamoDB ベンチマーク結果

## 実行環境
- 測定日時: 2025-07-24T10:30:00Z
- データ件数: 10,000件
- 実行回数: 100回/エンドポイント

## 性能比較
| エンドポイント | 平均(ms) | 最小(ms) | 最大(ms) | 標準偏差 |
|-------------|---------|---------|---------|---------|
| sqlite-efs  | 64.5    | 45.2    | 89.3    | 12.1    |
| sqlite-tmp  | 5.2     | 3.1     | 8.9     | 1.8     |
| ddb         | 12.3    | 8.7     | 18.4    | 2.9     |

## 分析結果
- tmpコピー方式は EFS直接比で 12.4倍高速
- 初期化オーバーヘッド: 45ms (許容範囲内)
- DynamoDB比で 2.4倍高速

## 推奨構成
読み取り頻度 > 初期化頻度 の場合、tmpコピー方式が最適
```

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
│   ├── benchmark/     # ベンチマーク実行用アプリ
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
│   ├── benchmarks/    # ベンチマーク結果レポート格納
│   └── feat-aws-lambda-sqlite-with-efs.md
├── package.json       # ワークスペース設定
└── pnpm-workspace.yaml
```

## API設計

### エンドポイント仕様

1. **POST /insert** - DynamoDBにデータ投入 + SQLiteファイル再生成（時間測定）
2. **GET /sqlite-efs** - EFS上のSQLiteから読み出し（時間測定）
3. **GET /sqlite-tmp** - /tmp上のSQLiteから読み出し（EFSから再コピー+読み取り時間測定）
4. **GET /ddb** - DynamoDBからの読み出し（時間測定）
5. **GET /benchmark** - 自動ベンチマーク実行（新しいセッションで各エンドポイント100回実行→当該セッション統計返却）
6. **GET /benchmark/sessions** - 過去のベンチマークセッション一覧を取得
7. **GET /benchmark/sessions/:id** - 特定セッションの詳細結果を取得
8. **GET /benchmark/trends** - 全セッションの統計傾向分析結果を取得
9. **GET /benchmark/report** - Markdown形式のベンチマーク結果レポート生成
10. **GET /benchmark/export/csv** - CSV形式の生データエクスポート

### DynamoDBシングルテーブル設計

参考：[Amazon DynamoDB におけるシングルテーブル vs マルチテーブル設計](https://aws.amazon.com/jp/blogs/news/single-table-vs-multi-table-design-in-amazon-dynamodb/)

**テーブル名**: `aws-lambda-sqlite-dev-main`

**キー設計**:

- **PK (Partition Key)**: エンティティタイプ別の分散キー
- **SK (Sort Key)**: エンティティ内での並び順・一意性確保
- **GSI1PK/GSI1SK**: クエリパターン用インデックス

**エンティティ設計**:

#### 1. randomsエンティティ

```typescript
{
  PK: "RANDOM#2025-07-24",           // 日付別パーティション
  SK: "ITEM#{ULID}",                 // 個別アイテム
  GSI1PK: "RANDOM",                  // 全件クエリ用
  GSI1SK: "2025-07-24T10:30:00Z",    // 作成日時順ソート
  entity: "random",
  id: "{ULID}",
  random_value: 0.123456789,
  created_at: "2025-07-24T10:30:00Z"
}
```

#### 2. benchmark_sessionエンティティ（ベンチマーク実行単位）

```typescript
{
  PK: "BENCHMARK_SESSION",
  SK: "SESSION#{ULID}",             // 個別ベンチマーク実行
  GSI1PK: "BENCHMARK_SESSION",      // 全セッション一覧用
  GSI1SK: "2025-07-24T10:30:00Z",   // 実行日時順ソート
  entity: "benchmark_session",
  session_id: "{ULID}",
  executed_at: "2025-07-24T10:30:00Z",
  iterations: 100,                   // 各エンドポイント実行回数
  data_count: 10000,                // 測定時データ件数
  summary: {
    "sqlite-efs": { avg: 64.5, min: 45.2, max: 89.3, std: 12.1 },
    "sqlite-tmp": { avg: 5.2, min: 3.1, max: 8.9, std: 1.8 },
    "ddb": { avg: 12.3, min: 8.7, max: 18.4, std: 2.9 }
  }
}
```

#### 3. benchmark_resultエンティティ（個別測定結果）

```typescript
{
  PK: "BENCHMARK_RESULT#{session_id}",  // セッション別パーティション
  SK: "RESULT#{ULID}",                  // 個別測定結果
  GSI1PK: "BENCHMARK_RESULT",           // 全測定結果用
  GSI1SK: "2025-07-24T10:30:00Z",       // 測定日時順ソート
  entity: "benchmark_result",
  session_id: "{session_ULID}",         // どのベンチマーク実行の結果か
  result_id: "{ULID}",
  endpoint: "sqlite-efs" | "sqlite-tmp" | "ddb",
  response_time_ms: 64.123,
  copy_time_ms?: 45.2,                  // tmpコピー方式の場合のEFS→tmpコピー時間
  read_time_ms: 19.1,                   // 実際の読み取り時間（tmpコピー方式では純粋な読み取り時間）
  measured_at: "2025-07-24T10:30:00.123Z"
}
```

#### 4. configエンティティ（設定管理用）

```typescript
{
  PK: "CONFIG",
  SK: "APP_SETTINGS",
  GSI1PK: "CONFIG",
  GSI1SK: "APP_SETTINGS",
  entity: "config",
  sqlite_file_path: "/mnt/efs/data.db",
  benchmark_enabled: true,
  data_generation_count: 10000
}
```

**クエリパターン**:

1. **全ランダムデータ取得**: `GSI1PK = "RANDOM"`
2. **日付別ランダムデータ**: `PK = "RANDOM#2025-07-24"`
3. **ベンチマークセッション一覧**: `PK = "BENCHMARK_SESSION"`
4. **特定セッションの個別結果**: `PK = "BENCHMARK_RESULT#{session_id}"`
5. **全セッション統計分析**: `GSI1PK = "BENCHMARK_SESSION"` → summary集計
6. **設定取得**: `PK = "CONFIG", SK = "APP_SETTINGS"`

## タスク分解

### フェーズ1: プロジェクト基盤構築

**TDD最重視**: 各ファイル作成前にテストを先行実装

1. **pnpm workspace初期化**
   - pnpm-workspace.yaml設定
   - packages/api、console、cdk構成
   - TypeScript、biome設定
   - **1ファイル修正完了ごと**: リント実行 + テスト実行

2. **データ投入コンソールアプリ**
   - ランダムデータ生成・投入機能
   - `pnpm console:seed`コマンド対応
   - **1ファイル修正完了ごと**: リント実行 + テスト実行
   - **TDD**: テストファースト開発で100%カバレッジ

3. **ベンチマーク実行アプリ**
   - AWS SDK使用でLambda Function URL自動取得
   - `pnpm benchmark:run`コマンド対応
   - CSV/Markdown形式で`docs/benchmarks/`に結果自動出力
   - **1ファイル修正完了ごと**: リント実行 + テスト実行
   - **TDD**: テストファースト開発で100%カバレッジ

**評価項目**:

- [ ] `pnpm lint && pnpm build && pnpm test`が無エラー完了
- [ ] 全ファイルでテスト100%カバレッジ達成

### フェーズ2: Lambda API実装

**TDD最重視**: 各エンドポイント・機能ごとにテストを先行実装

1. **Hono API実装**
   - 4つのエンドポイント（insert, sqlite-efs, sqlite-tmp, ddb）
   - randomsテーブル（drizzle schema）
   - DynamoDB操作
   - **1ファイル修正完了ごと**: リント実行 + テスト実行
   - **TDD**: テストファースト開発で100%カバレッジ

**評価項目**:

- [ ] 単体テスト100%カバレッジ
- [ ] 全ファイルでリント・テストエラーなし
- [ ] ローカルでの動作確認

### フェーズ3: AWS CDK実装

**TDD最重視**: CDKスタック・リソースごとにテストを先行実装

1. **CDKインフラ定義**
   - Lambda関数設定
   - EFS設定とマウント
   - DynamoDB randomsテーブル
   - API Gateway設定
   - **1ファイル修正完了ごと**: リント実行 + テスト実行
   - **TDD**: CDKテストファースト開発で100%カバレッジ

**評価項目**:

- [ ] CDKのテスト実装100%カバレッジ
- [ ] 全ファイルでリント・テストエラーなし
- [ ] `cdk synth`が成功
- [ ] `cdk deploy`でリソース作成成功

### フェーズ4: 動作確認

**TDD最重視**: 統合テスト・E2Eテストを先行実装

1. **実際のAWS環境テスト**
   - コンソールアプリでのデータ投入
   - EFS vs /tmp vs DynamoDBパフォーマンス比較
   - **1ファイル修正完了ごと**: リント実行 + テスト実行
   - **TDD**: 統合・E2Eテストファースト開発で100%カバレッジ

**評価項目**:

- [ ] 全エンドポイントの動作確認
- [ ] パフォーマンステスト結果取得
- [ ] 統合・E2Eテスト100%カバレッジ
- [ ] 全ファイルでリント・テストエラーなし

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
- `pnpm benchmark:run` - ベンチマーク実行（結果を`docs/benchmarks/`に自動保存）
- `pnpm cdk:deploy` - CDKデプロイ
- `pnpm api:dev` - ローカル開発サーバー

## 作業状況

- [x] 作業ブランチ作成 (`feat/aws-lambda-sqlite-with-efs`)
- [x] 空コミット + プッシュ完了
- [x] プルリクエスト作成完了（<https://github.com/phasetr/pt-javascript/pull/2>）
- [x] 作業計画書更新完了（pnpm workspace + コンソールアプリ対応）
- [x] **フェーズ1完了**: pnpm workspace初期化 + データ投入コンソールアプリ実装完了
  - pnpm workspace設定（package.json, pnpm-workspace.yaml, tsconfig.json, biome.json）
  - console パッケージ実装（data-generator.ts, cli.ts, dynamodb-seeder.ts）
  - TDD実装: 16テスト100%カバレッジ
  - 定期確認無エラー完了
- [x] **フェーズ1.5完了**: ベンチマークアプリ実装完了
  - benchmark パッケージ実装（lambda-url-resolver.ts, http-client.ts, benchmark-runner.ts, cli.ts）
  - CloudFormation stackからLambda URL自動取得
  - HTTPクライアントでのエンドポイントベンチマーク測定
  - CSV/Markdownレポート自動生成機能
  - CLI実行インターフェース
  - TDD実装: 25テスト100%カバレッジ
  - 定期確認無エラー完了

### 実装完了機能
- `pnpm console:seed --count 1000` - ランダムデータをDynamoDBに投入
- `pnpm benchmark:run` - ベンチマーク実行（結果を`docs/benchmarks/`に自動保存）
- DynamoDBシングルテーブル設計対応（PK: RANDOM#date, SK: ITEM#ulid）
- CLI引数パース・バリデーション
- エラーハンドリング
- AWS SDK CloudFormation連携
- HTTPベンチマーク測定

### 現在の状況
- **全定期確認**: 無エラー完了（lint, build, typecheck, test全て通過）
- **テスト状況**: 41テスト100%カバレッジ（console: 16テスト、benchmark: 25テスト）
- **コミット状況**: 全ファイルコミット完了、漏れなし

### 次のフェーズ: Lambda API実装開始
packages/apiパッケージでHono APIの実装に移行します。

#### Lambda API 実装予定
- **エンドポイント**: insert, sqlite-efs, sqlite-tmp, ddb
- **技術スタック**: Hono + drizzle ORM + AWS Lambda
- **テスト方針**: TDD、100%カバレッジ
- **SQLite構成**: EFS直接アクセス vs tmpコピー方式比較
