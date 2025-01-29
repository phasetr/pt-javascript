# Welcome to your CDK TypeScript project

`CDK`内で直接Lambda関数を`fromInline`で作っていて、他からソースコード・プロジェクトを読み込む形ではないチュートリアルのサンプル。

- [AWS Tutorial](https://docs.aws.amazon.com/ja_jp/cdk/v2/guide/hello_world.html)

## 手順メモ

- 次のコマンドを実行する

```sh
aws sts get-caller-identity --query "Account" --output text
aws configure get region
```

- `.env.sample`をコピーして`.env`を作る
- 上記の結果を`.env`に記録する
- 下記コマンドを実行する

```sh
cdk bootstrap
```

- 下記コマンドでデプロイする

```sh
cdk deploy
```

- 下記コマンドでデプロイできているか確認する

```sh
aws cloudformation describe-stacks \
  --stack-name HelloCdkStack \
  --query "Stacks[0].Outputs[?OutputKey=='myFunctionUrlOutput'].OutputValue" --output text \
  | xargs curl
```

- 下記コマンドで削除する

```sh
cdk destroy
```

## プロジェクト初期化：最初の一度だけ実行

```sh
mkdir hello-cdk && cd hello-cdk
cdk init app --language typescript
```

## ORIG

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build`   compile typescript to js
- `npm run watch`   watch for changes and compile
- `npm run test`    perform the jest unit tests
- `npx cdk deploy`  deploy this stack to your default AWS account/region
- `npx cdk diff`    compare deployed stack with current state
- `npx cdk synth`   emits the synthesized CloudFormation template
