# 環境変数から引数への純粋関数化リファクタリング計画

## 概要

実行系ファイルで利用している環境変数を純粋関数の引数として与える形に修正し、TDDによるテスタビリティ向上とカバレッジ100%を確保する。

## 現状の問題

1. 環境変数に依存した実装により純粋関数化が困難
2. テストでの環境変数設定・復元が複雑
3. 実行時の環境変数設定が煩雑

## 対象ファイル

### 実行系ファイル

1. `/packages/create-s3vectors-index/src/index.ts` - VECTOR_BUCKET_NAME, VECTOR_INDEX_NAME, VECTOR_DIMENSION, DISTANCE_METRIC
2. `/packages/load-source/src/index.ts` - WIKI_TITLE_NAME
3. `/packages/add-vectors/src/index.ts` - WIKI_TITLE_NAME, VECTOR_BUCKET_NAME, VECTOR_INDEX_NAME
4. `/packages/lambda/src/index.ts` - VECTOR_BUCKET_NAME, VECTOR_INDEX_NAME

### 対応するテストファイル

1. `/packages/create-s3vectors-index/src/index.test.ts`
2. `/packages/load-source/src/index.test.ts`
3. `/packages/add-vectors/src/index.test.ts`
4. `/packages/lambda/src/index.test.ts`

## リファクタリング方針

### 1. デフォルト値の設定

- `VECTOR_INDEX_NAME`: `'madeinabyss-s3vectors-search-index'`
- `WIKI_TITLE_NAME`: `'メイドインアビス'`
- `VECTOR_DIMENSION`: `1024`
- `DISTANCE_METRIC`: `'euclidean'`

### 2. 関数設計パターン

```typescript
// Before
const bucketName = process.env.VECTOR_BUCKET_NAME;

// After
function createIndex(options: {
  bucketName: string;
  indexName?: string; // デフォルト値あり
  dimension?: number; // デフォルト値あり
  distanceMetric?: string; // デフォルト値あり
}): Result<void, Error>
```

### 3. CLI実行パターン

```bash
# Before
export VECTOR_INDEX_NAME="madeinabyss-s3vectors-search-index"
pnpm --filter create-s3vectors-index create-index

# After
pnpm --filter create-s3vectors-index create-index --bucket-name="bucket" --index-name="madeinabyss-s3vectors-search-index"
```

## 作業手順

### Phase 1: create-s3vectors-index の純粋関数化

1. 引数パーサーライブラリの選定
   - よく使われていてメンテナンスが継続されているライブラリを調査
   - ダウンロード数、最終更新日、GitHub Stars等を確認
   - TypeScript対応状況の確認
2. TDDによるテストケース作成（Red）
3. 引数パーサーの実装（Green）
4. 環境変数依存の除去（Green）
5. 純粋関数への分離（Refactor）
6. カバレッジ100%の確保

### Phase 2: load-source の純粋関数化

1. TDDによるテストケース作成（Red）
2. CLI引数対応（Green）
3. 環境変数依存の除去（Green）
4. 純粋関数への分離（Refactor）

### Phase 3: add-vectors の純粋関数化

1. TDDによるテストケース作成（Red）
2. CLI引数対応（Green）
3. 環境変数依存の除去（Green）
4. 純粋関数への分離（Refactor）

### Phase 4: lambda の引数対応

1. TDDによるテストケース作成（Red）
2. 環境変数を維持しつつ引数でオーバーライド可能な設計（Green）
3. テスト時の純粋関数化（Refactor）

### Phase 5: 総合テスト・品質確認

1. 全パッケージでの品質確認実行
2. READMEの更新
3. 統合テストの実行

## 品質確認項目

各Phaseで以下を実行：

- `pnpm lint:fix`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:dev`（カバレッジ100%確認）

最終確認：

- `pnpm clean:build`
- `pnpm build`
- `pnpm dev:check`

## 期待される効果

1. **純粋関数化**: 副作用の外部化によるテスタビリティ向上
2. **実行時柔軟性**: 引数指定による実行時パラメータ変更
3. **テスト簡素化**: 環境変数設定・復元の不要化
4. **保守性向上**: 明確な引数定義による可読性向上
