# Welcome to your CDK TypeScript project

`Hono`でルートにアクセスすると`Hello Hono!`を返すだけのごく単純なサーバーを`App Runner`+`ECR`で`CDK`でデプロイする。

## 参考

- [CDKでNext.jsのスタンドアロンモードでビルドしたイメージを AWS App Runnerへデプロイする](https://dev.classmethod.jp/articles/app-runner-nextjs-cdk/)

## AWS

### デプロイ

```sh
cdk deploy
```

### アクセス確認

```sh
URL=https://$(aws cloudformation describe-stacks --stack-name CdkApprunnerEcrStack --query "Stacks[0].Outputs[?OutputKey=='caeapprunnerurl'].OutputValue" --output text) && curl ${URL} && echo "" && echo ${URL}
```

### 破棄

```sh
cdk destroy
```

## ローカル

```sh
cd src
npm run dev
curl http://localhost:3000
```

## ORIG

You should explore the contents of this project. It demonstrates a CDK app with an instance of a stack (`CdkApprunnerEcrStack`)
which contains an Amazon SQS queue that is subscribed to an Amazon SNS topic.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build`   compile typescript to js
- `npm run watch`   watch for changes and compile
- `npm run test`    perform the jest unit tests
- `cdk deploy`      deploy this stack to your default AWS account/region
- `cdk diff`        compare deployed stack with current state
- `cdk synth`       emits the synthesized CloudFormation template
