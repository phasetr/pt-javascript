# axiosとnode-fetchの統合

## 概要

プロジェクト内で`axios`と`node-fetch`の両方が使用されていたため、一方のライブラリに統一しました。
`axios`を採用し、`node-fetch`の使用を削除しました。

## 変更内容

### 1. 現状の調査

プロジェクト内で`axios`と`node-fetch`の使用状況を確認しました。

```bash
# axiosの使用状況を確認
search_files for 'import.*axios|require.*axios' in '*.ts'
# node-fetchの使用状況を確認
search_files for 'import.*fetch|require.*fetch' in '*.ts'
```

調査の結果、`packages/integration-tests/src/api-client.ts`ファイルで両方のライブラリが使用されていることがわかりました。

### 2. コードの分析

`api-client.ts`ファイルを分析したところ、以下の状況が確認できました：

- クラス初期化時に`axios`インスタンスを作成
- 実際のAPIリクエスト（createTodo, getTodosByUserId, getTodoById, updateTodo, deleteTodo）では`node-fetch`を使用

### 3. 実装の統一

`axios`に統一するため、以下の変更を行いました：

1. `api-client.ts`ファイル内の全ての`node-fetch`を使用したリクエストを`axios`に置き換え
2. `package.json`から`node-fetch`の依存関係を削除

### 4. 変更点の詳細

#### `api-client.ts`の変更

- すべてのHTTPリクエスト（POST, GET, PUT, DELETE）を`axios`クライアントインスタンスを使用するように変更
- 認証情報の設定方法を`axios`の形式に合わせて調整
- JSONデータの処理方法を統一

#### `package.json`の変更

```diff
  "dependencies": {
    "aws-utils": "workspace:*",
    "axios": "^1.6.7",
-   "node-fetch": "2"
  },
```

### 5. テスト結果

変更後、ローカル環境でのテストを実行し、すべてのテストが正常に通過することを確認しました。

```bash
cd packages/integration-tests && pnpm test:local
```

## 結論

- プロジェクト内のHTTPクライアントライブラリを`axios`に統一
- コードの一貫性が向上し、メンテナンス性が改善
- 依存関係の数が減少
