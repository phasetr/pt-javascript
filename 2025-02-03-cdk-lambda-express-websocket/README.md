# Welcome to your CDK TypeScript project

- [Building a Real-Time Chat Service with AWS API Gateway and WebSockets Using Express.js & AWS Lambda](https://medium.com/@sonishubham65/building-a-real-time-chat-service-with-aws-api-gateway-and-websockets-using-express-js-aws-lambda-321e7330c18b)

## 動作確認

```sh
URL=$(aws cloudformation describe-stacks --stack-name CdkLambdaExpressWebsocketStack --query "Stacks[0].Outputs[?OutputKey=='WebSocketApiEndpoint'].OutputValue" --output text) && wscat -c "$URL"
```

```sh
{action: "sendMessage", data: "Hello World"}
```

## プロジェクトの初期化：最初の一回だけ

```sh
mkdir cdk-lambda-websocket && cd cdk-lambda-websocket
cdk init sample-app --language typescript
```

## ORIG

You should explore the contents of this project. It demonstrates a CDK app with an instance of a stack (`CdkLambdaExpressWebsocketStack`)
which contains an Amazon SQS queue that is subscribed to an Amazon SNS topic.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build`   compile typescript to js
- `npm run watch`   watch for changes and compile
- `npm run test`    perform the jest unit tests
- `cdk deploy`      deploy this stack to your default AWS account/region
- `cdk diff`        compare deployed stack with current state
- `cdk synth`       emits the synthesized CloudFormation template
