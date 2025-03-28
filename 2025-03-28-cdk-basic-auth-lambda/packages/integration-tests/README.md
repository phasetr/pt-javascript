# Todo API Integration Tests

このパッケージはTodo APIの結合テストを提供します。ローカル環境、開発環境、本番環境に対してテストを実行できます。

## セットアップ

1. `.env.sample`をコピーして`.env`ファイルを作成します：

```bash
cp .env.sample .env
```

2. `.env`ファイルを編集して、各環境の認証情報とAPIエンドポイントを設定します。

3. 依存関係をインストールします：

```bash
pnpm install
```

## テストの実行

### コマンドラインから直接実行

```bash
# デフォルト環境（local）でテストを実行
pnpm test

# 特定の環境でテストを実行
pnpm test:local  # ローカル環境
pnpm test:dev    # 開発環境
pnpm test:prod   # 本番環境
```

### スクリプトを使用して実行

```bash
# デフォルト環境（local）でテストを実行
pnpm start

# 特定の環境でテストを実行
pnpm start:local  # ローカル環境
pnpm start:dev    # 開発環境
pnpm start:prod   # 本番環境
```

または、直接スクリプトを実行することもできます：

```bash
tsx src/run-tests.ts --env=local
tsx src/run-tests.ts --env=dev
tsx src/run-tests.ts --env=prod
```

### 接続テスト

APIへの接続をテストするための簡易スクリプトも用意されています：

```bash
# デフォルト環境（local）で接続テストを実行
pnpm test:connection

# 特定の環境で接続テストを実行
pnpm test:connection:local  # ローカル環境
pnpm test:connection:dev    # 開発環境
pnpm test:connection:prod   # 本番環境
```

このスクリプトは、すべてのAPIエンドポイントに対して簡単なリクエストを実行し、正常に動作しているかを確認します。

## テストの内容

このテストスイートは、Todo APIの以下のエンドポイントをテストします：

1. `POST /api/todos` - 新しいTodoを作成
2. `GET /api/todos/user/:userId` - ユーザーのTodoを取得
3. `GET /api/todos/:id` - 特定のTodoを取得
4. `PUT /api/todos/:id` - Todoを更新
5. `DELETE /api/todos/:id` - Todoを削除

各テストは順番に実行され、前のテストで作成されたリソースを後続のテストで使用します。

## 環境設定

テストは以下の環境で実行できます：

- `local` - ローカル開発環境（デフォルト）
- `dev` - 開発環境
- `prod` - 本番環境

環境は環境変数 `ENV` または `--env` コマンドラインオプションで指定できます。
