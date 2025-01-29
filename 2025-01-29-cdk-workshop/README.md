# Welcome to your CDK TypeScript project

- [AWS CDK Immersion Day ワークショップ](https://catalog.us-east-1.prod.workshops.aws/workshops/10141411-0192-4021-afa8-2436f3c66bd8/ja-JP)
- TODO
  - LambdaのコードのTypeScript化
  - コードを置く適切なディレクトリ設定の確認

## `CDK`のインストール確認

```sh
npm install -g aws-cdk
cdk --version
```

## ワークショップのコマンド履歴

```sh
cdk synth
cdk bootstrap
cdk deploy
```

`aws cloudformation describe-stacks`でデプロイ内容の確認

```sh
aws cloudformation describe-stacks --stack-name CdkWorkshopStack
```

```sh
cdk diff
cdk deploy
aws cloudformation describe-stacks --stack-name CdkWorkshopStack
```

```sh
cdk deploy --hotswap
# cdk watch
```

```sh
cdk deploy
aws cloudformation describe-stacks \
  --stack-name CdkWorkshopStack \
  --query "Stacks[0].Outputs[?OutputKey=='myApiGatewayUrlOutput'].OutputValue" \
  --output text \
  | xargs curl -i
```

```sh
URL=$(aws cloudformation describe-stacks --stack-name CdkWorkshopStack --query "Stacks[0].Outputs[?OutputKey=='myApiGatewayUrlOutput'].OutputValue" --output text)
curl -i $URL
curl -i $URL/hello
curl -i $URL/hello/test
```

```sh
cdk destroy
```

## プロジェクトの初期化：最初の一回だけ

```sh
mkdir cdk-workshop && cd cdk-workshop
cdk init sample-app --language typescript
```

## ORIG

You should explore the contents of this project. It demonstrates a CDK app with an instance of a stack (`CdkWorkshopStack`)
which contains an Amazon SQS queue that is subscribed to an Amazon SNS topic.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build`   compile typescript to js
- `npm run watch`   watch for changes and compile
- `npm run test`    perform the jest unit tests
- `cdk deploy`      deploy this stack to your default AWS account/region
- `cdk diff`        compare deployed stack with current state
- `cdk synth`       emits the synthesized CloudFormation template
