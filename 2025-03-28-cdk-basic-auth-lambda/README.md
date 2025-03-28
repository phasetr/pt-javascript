# README

- メモ用：[参考にしたリポジトリ](https://github.com/mizchi/ailab)
- [【CDK】Honoで簡単なCRUD処理のバックエンドAPIを作成してみた（Lambda + API Gateway + DynamoDB）](https://dev.classmethod.jp/articles/cdk-hono-crud-api-lambda-api-gateway-dynamodb/)
- [GitHub](https://github.com/yuu551/hono-backend-api-lambda)

AI向け注意：作業を進めるときはまず`.clinerules`を読むこと。

## プロジェクト概要

下記構成をCDKで構築し,
Honoの実装含めて全てTypeScriptで実装する.

- Honoの実行環境はLambdaを選択
- LambdaはAPI Gateway経由で実行
- データソースとしてはDynamoDBを選択

Todoアプリケーションを作成する.
データソースをDynamoDBとする簡単なCRUD処理を行うバックエンドのAPIサーバーを作成する.

### Todoテーブル

| 論理名     | 物理名    | 型   | 備考                                |
|------------+-----------+------+-------------------------------------|
| ID         | id        | S    | HASH（パーティションキー）          |
| タイトル   | title     | S    |                                     |
| 完了フラグ | completed | BOOL |                                     |
| 期日       | dueDate   | S    |                                     |
| ユーザーID | userId    | S    | ユーザーIDで検索するためにGSIを設定 |
| 作成日     | createdAt | S    |                                     |
| 更新日     | updatedAt | S    |                                     |

## プロジェクトの略称

CBUL(Cdk Basic Auth Lambda)

## 基本的なインフラ

- `AWS`

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
