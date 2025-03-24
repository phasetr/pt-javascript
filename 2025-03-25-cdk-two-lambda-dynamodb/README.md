# README

TODO: dynamodbのキーはPK, SK

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

## コマンドメモ

```sh
npm create hono@latest apps/hono-api
npx create-remix@latest apps/remix
```
