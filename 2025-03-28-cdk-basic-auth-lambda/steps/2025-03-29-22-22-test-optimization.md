# CDK テスト最適化

## 問題

`pnpm test:u:cbal` コマンドの実行が非常に遅く、約20秒かかっていました。これはCDKのテストが重いためです。

## 原因分析

1. CDKのテストでは、実際のCloudFormationテンプレートを生成するため、処理が重くなります
2. テストごとに新しいCDK AppとStackを作成していました
3. 複数の環境（dev/prod）に対して別々のテストを実行していました
4. テストケースが細かく分かれており、同様のセットアップが繰り返されていました

## 最適化方法

### 1. cbal-stack.test.ts の最適化

**変更前:**

- `beforeEach` で毎回新しいAppとStackを作成
- 各テストで個別にテンプレートを検証
- dev環境とprod環境のテストが分離

**変更後:**

- `beforeAll` で一度だけAppとStackを作成
- 共有インスタンスを使用して複数のテストを実行
- 関連するアサーションをグループ化
- テンプレート生成を最小限に抑制

### 2. cbal.test.ts の最適化

**変更前:**

- 環境ごとに別々のテストケース
- 各テストで同様のセットアップコード

**変更後:**

- 複数の環境テストを1つのテストケースに統合
- セットアップコードを共有
- モジュールのインポート回数を削減

### 3. vitest.config.ts の最適化

**変更前:**

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    testTimeout: 30000, // 30秒のタイムアウト
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    }
  }
});
```

**変更後:**

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    testTimeout: 10000, // 10秒に短縮
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  }
});
```

## 結果

最適化前: **20.15秒**
最適化後: **8.18秒**

**59%の実行時間短縮**を達成しました。

## 教訓

1. CDKテストでは、可能な限りAppとStackのインスタンスを再利用する
2. テストケースをまとめられる場合は統合する
3. テンプレート生成は最小限に抑える
4. 関連するアサーションをグループ化する
5. 不要なセットアップの繰り返しを避ける

これらの最適化手法は他のCDKプロジェクトにも適用可能です。
