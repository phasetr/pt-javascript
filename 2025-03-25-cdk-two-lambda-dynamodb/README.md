# README

AI向け注意：作業を進めるときはまず`.clinerules`を読むこと。

## TODO

- サーバーの動作確認・ローカルのDynamoDBをREADMEから`doc`に移行しつつ、
  AWS CLIから(packagesのライブラリを利用した)スクリプトに移行する
- `Hono`の（ローカルでの）動作確認
- `Remix`の（ローカルでの）動作確認
- `Hono`・`Remix`のローカルでの簡易結合テスト生成（テーブルはテスト用に別に用意できるか？）
- 作業手順の残りの実行

## プロジェクト概要

- `Deno`は一切使わずに`Node.js`だけを利用する
- 技術検証のため、サービスとしては極めて簡潔な内容とする
- データベースを共有した二つのシンプルなサービスを作る
- サービスの一つはHono製のWeb APIでLambdaにデプロイする.
  特にルートにアクセスしたら`Hello Lambda in Hono!`と返すだけで良い
- サービスの一つはRemix製のMPAで同じくLambdaにデプロイする.
  `create-remix`のような雛形生成コマンドを利用して生成したソースそのままで良い.
  ただし`Lambda`にリリースするために何か修正が必要ならその分は適切に修正する
- 必要に応じて`npm workspace`のような機構を利用し,
  データベースに関わるプログラム・ライブラリを共有できるようにする
- データベースは`DynamoDB`とする
- データベースは`docker compose`でローカル起動できるようにする

## プロジェクトの略称

CTLD

## 基本的なインフラ

`AWS`

## ローカルのDynamoDB

Dockerを利用して立ち上げる。

```sh
docker compose up
docker compose up -d
```

停止方法：

```sh
docker compose down
docker compose stop dynamodb-local
```

### コマンドによるユーザーの確認

基本的なユーザー一覧取得コマンド:

```sh
aws dynamodb scan \
  --table-name CTLD-local-DDB \
  --filter-expression "SK = :profile" \
  --expression-attribute-values '{":profile": {"S": "PROFILE"}}' \
  --endpoint-url http://localhost:8000
```

適当なユーザ一名だけを取得する

```sh
aws dynamodb scan \
  --table-name CTLD-local-DDB \
  --filter-expression "SK = :profile" \
  --expression-attribute-values '{":profile": {"S": "PROFILE"}}' \
  --query "Items[].{PK: PK.S, Name: name.S, Email: email.S}" \
  --limit 1 \
  --endpoint-url http://localhost:8000

aws dynamodb scan \
  --table-name CTLD-local-DDB \
  --filter-expression "SK = :profile" \
  --expression-attribute-values '{":profile": {"S": "PROFILE"}}' \
  --query "Items[].{UserId: userId.S}" \
  --limit 1 \
  --endpoint-url http://localhost:8000
```

見やすいテーブル形式で表示する

```sh
aws dynamodb scan \
  --table-name CTLD-local-DDB \
  --filter-expression "SK = :profile" \
  --expression-attribute-values '{":profile": {"S": "PROFILE"}}' \
  --query "Items[].{UserId: userId.S}" \
  --output table \
  --endpoint-url http://localhost:8000
```

特定のユーザーを検索する（メールアドレスで検索）

```sh
aws dynamodb query \
  --table-name CTLD-local-DDB \
  --index-name EmailIndex \
  --key-condition-expression "email = :email" \
  --expression-attribute-values '{":email": {"S": "example@email.com"}}' \
  --endpoint-url http://localhost:8000
```

特定のユーザーを検索する（ユーザーIDで検索）

```sh
aws dynamodb query \
  --table-name CTLD-local-DDB \
  --key-condition-expression "PK = :pk AND SK = :sk" \
  --expression-attribute-values '{":pk": {"S": "USER#userId"}, ":sk": {"S": "PROFILE"}}' \
  --endpoint-url http://localhost:8000
```

JSON形式で出力してファイルに保存

```sh
aws dynamodb scan \
  --table-name CTLD-local-DDB \
  --filter-expression "SK = :profile" \
  --expression-attribute-values '{":profile": {"S": "PROFILE"}}' \
  --query "Items[].{userId: userId.S, name: name.S, email: email.S}" \
  --output json \
  --endpoint-url http://localhost:8000 > users.json
```

## サーバーの動作確認

### `Hono`

```sh
curl $(aws cloudformation describe-stacks \
  --stack-name CdkTwoLambdaDynamodbStack-Dev \
  --query "Stacks[0].Outputs[?OutputKey=='CTLDdevHonoApiEndpoint'].OutputValue" \
  --output text)
```

結果

```txt
日本時間 Hello Lambda in Hono! Environment: dev
```

```sh
curl $(aws cloudformation describe-stacks \
  --stack-name CdkTwoLambdaDynamodbStack-Prod \
  --query "Stacks[0].Outputs[?OutputKey=='CTLDprodHonoApiEndpoint'].OutputValue" \
  --output text)
```

結果

```txt
日本時間 Hello Lambda in Hono! Environment: prod
```

### `Remix`

Macでの確認法：

開発環境

```sh
open $(aws cloudformation describe-stacks \
  --stack-name CdkTwoLambdaDynamodbStack-Dev \
  --query "Stacks[0].Outputs[?OutputKey=='CTLDdevRemixApiEndpoint'].OutputValue" \
  --output text)
```

結果：`Remix`の画面が見られ、画面中央`Remix`の下に`in dev`と表示される。

本番環境

```sh
open $(aws cloudformation describe-stacks \
  --stack-name CdkTwoLambdaDynamodbStack-Prod \
  --query "Stacks[0].Outputs[?OutputKey=='CTLDprodRemixApiEndpoint'].OutputValue" \
  --output text)
```

結果：`Remix`の画面が見られ、画面中央`Remix`の下に`in prod`と表示される。

## 作業手順

各ステップごとに人手で目視・手動で確認します.
必ず次の手順で作業し,
各ステップで止めてください.
ステップ終了時は何を確認するべきか箇条書きにしてください.
結果確認用に適切なjsまたはtsプログラム(jsまたはtsファイル)としてまとめ,
得られるべき結果と実際の値を比較する部分もプログラムにおさめてください.
日時のように都度得られるべき結果が変わる場合は適切な比較対象を設定してください.
最後にステップごとの内容は`steps`ディレクトリに`日時-日付-step.md`として記録してください.

1. 今のコードベースで`CDK`コードを書き換えてAWSにデプロイして動作確認する。
2. `dev`と`prod`版をリリースできるようにする.
3. pnpm workspace化する.
   workspace化してもローカル環境で元の動作が再現できるか確認する.
   `cdk deploy`の結果も変わらないか確認する.
4. `DynamoDB`のプロジェクトを作り、簡単な二種類のテーブルを作り、
   それらに対するCRUD操作とテストを書く。
   テストのライブラリは`Vitest`を利用する。
   ユーザー一覧など一覧系の取得のための`GSI`も実装する
5. 次のステップに向けてローカルでの確認用にデータを登録する。
   ユーザーは10名、
   タスクは全ユーザー合計で1000件登録し、
   ユーザーごとに登録されているタスク数は変える。
6. `Hono`と`Remix`から`DynamoDB`を呼び出せるようにする。テストも書く。
7. 認証・認可の実装.
   主な部分はGoogleの認証連携を利用する.
8. フォーム入力によるデータ作成・更新機能の実装
