# README

AI向け注意：作業を進めるときはまず`.clinerules`を読むこと。

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
特にできる限りCLIで簡潔に確認できるようにした上で,
確認用のコマンドと得られるべき結果を明記して`steps`ディレクトリに`日時-日付-step.md`に記録してください.

1. 今のコードベースで`CDK`コードを書き換えてAWSにデプロイして動作確認する。
2. `dev`と`prod`版をリリースできるようにする.
3. npm workspace化する.
   workspace化してもローカル環境で元の動作が再現できるか確認する.
   `cdk deploy`の結果も変わらないか確認する.
4. `DynamoDB`のプロジェクトを作り、簡単な二種類のテーブルを作り、
   それらに対するCRUD操作とテストを書く。
   テストのライブラリは`Vitest`を利用する。
5. `Hono`と`Remix`から`DynamoDB`を呼び出せるようにする。テストも書く。
