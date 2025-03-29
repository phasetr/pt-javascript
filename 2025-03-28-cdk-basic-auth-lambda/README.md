# README

- メモ用：[参考にしたリポジトリ](https://github.com/mizchi/ailab)
- [【CDK】Honoで簡単なCRUD処理のバックエンドAPIを作成してみた（Lambda + API Gateway + DynamoDB）](https://dev.classmethod.jp/articles/cdk-hono-crud-api-lambda-api-gateway-dynamodb/)
- [GitHub](https://github.com/yuu551/hono-backend-api-lambda)

AI向け注意：作業を進めるときはまず`.clinerules`を読むこと。

## プロジェクト概要

下記構成をCDKで構築し,
Honoの実装含めて全てTypeScriptで実装する.
特にデータソースをDynamoDBとしてTodoアプリケーションを作成する.
簡単なCRUD処理を行うバックエンドのAPIサーバーを作成する.

- Honoの実行環境はLambdaを選択し、Basic認証を利用する。
  本体ロジック用に`hono.ts`、
  `Lambda`用の受け口として`index.ts`、
  ローカル開発用に`index.local.ts`を用意してローカル開発しやすくする
- LambdaはAPI Gateway経由で実行
- データソースとしてはDynamoDBを選択。設計は`doc/ddb.md`を参照

## プロジェクトの略称

CBAL(Cdk Basic Auth Lambda)

## 基本的なインフラ

- `AWS`

## 実行時の注意

ルート・`packages/hono-api`配下にある`.env.sample`をコピーして`.env`を作成。
ローカルで`ENV`は`local`に設定すること。

## テストの実行方法

### 単体テスト

プロジェクトルートから以下のコマンドで単体テストを実行できます：

```bash
# 全パッケージの単体テストを実行
pnpm test:unit

# 特定のパッケージの単体テストを実行
pnpm test:unit:aws-utils
pnpm test:unit:integration-tests
pnpm test:unit:cbal

# ウォッチモードで単体テストを実行（ファイル変更時に自動的にテストを再実行）
pnpm test:unit:watch
pnpm test:unit:aws-utils:watch
pnpm test:unit:integration-tests:watch

# カバレッジレポート付きで単体テストを実行
pnpm test:unit:coverage
pnpm test:unit:aws-utils:coverage
pnpm test:unit:integration-tests:coverage
```

### 結合テスト

プロジェクトルートから以下のコマンドで結合テストを実行できます：

```bash
# ローカル環境での結合テスト（事前に pnpm local:start を実行してください）
pnpm test:integration:local

# 開発環境での結合テスト
pnpm test:integration:dev

# 本番環境での結合テスト
pnpm test:integration:prod
```

## 作業手順

### AI用

各ステップごとに人手で目視・手動で確認します.
必ず次の手順で作業し,
各ステップで止めてください.
ステップ終了時は何を確認するべきか箇条書きにしてください.
結果確認用に適切なjsまたはtsプログラム(jsまたはtsファイル)としてまとめ,
得られるべき結果と実際の値を比較する部分もプログラムにおさめてください.
日時のように都度得られるべき結果が変わる場合は適切な比較対象を設定してください.
最後にステップごとの内容は`steps`ディレクトリに`日時-日付-step.md`として記録してください.

1. (手動)：`pnpm workspace`化する.
    - ルート直下に`package.json`と`pnpm-workspace.yaml`をコピーする
2. (手動)：`packages/<プロジェクトの略称>`に`cdk init`する
3. (手動)：`packages/hono-api`で`Hono`を初期化する
4. 今のコードベースで`CDK`コードを書き換える.
   環境としては`dev`と`prod`を作る.
   どちらもスペックとしては最低限でよい.
   指定した構成でAWSにデプロイする.
5. `DynamoDB`のプロジェクトを`packages/db`に作成.
   上記の`Todo`テーブルの定義のもとでCRUD操作とテストを書く。
6. `Hono`から`DynamoDB`を呼び出せるようにする。テストも書く。
7. ローカル・AWS上の開発環境に対する簡易結合テストを作成する。
   APIは全てを一通り叩いて結果が返るか確認する。
   環境指定で`local`・`dev`・`prod`を選べるようにし、適切な環境を指定して簡易結合テストできるようにする.
   この指定がない場合は自動的に`local`になるとする。

### 自分用(都度消す)

Clineへの定型文：まず.clinerulesを読んでください。
いまREADME.mdの作業手順に関して進めたステップを確認し,
次のステップの作業を始めてください。
ワンステップだけ対応して、二つ以上のステップを一気に進めないでください。

```sh
corepack enable && corepack prepare pnpm@latest --activate
asdf reshim nodejs
pnpm -v

cdk init sample-app --language typescript
npm create hono@latest packages/hono
```
