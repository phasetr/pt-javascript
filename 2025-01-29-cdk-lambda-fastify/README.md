# Welcome to your CDK TypeScript project

## デプロイ

- `Docker`を立ち上げる

```sh
cdk deploy
aws cloudformation describe-stacks --stack-name CdkLambdaFastifyStack --query "Stacks[0].Outputs[?OutputKey=='LFApiGatewayUrl'].OutputValue" --output text | xargs curl
```

## プロジェクトの初期化：最初の一回だけ

```sh
mkdir cdk-lambda-fastify && cd cdk-lambda-fastify
cdk init sample-app --language typescript
```

## ORIG

You should explore the contents of this project. It demonstrates a CDK app with an instance of a stack (`CdkLambdaFastifyStack`)
which contains an Amazon SQS queue that is subscribed to an Amazon SNS topic.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build`   compile typescript to js
- `npm run watch`   watch for changes and compile
- `npm run test`    perform the jest unit tests
- `cdk deploy`      deploy this stack to your default AWS account/region
- `cdk diff`        compare deployed stack with current state
- `cdk synth`       emits the synthesized CloudFormation template
