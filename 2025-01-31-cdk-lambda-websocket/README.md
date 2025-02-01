# Welcome to your CDK TypeScript project

- 2024-09-21, [Building a Real-Time Chat Service with AWS API Gateway and WebSockets Using Express.js & AWS Lambda](https://medium.com/@sonishubham65/building-a-real-time-chat-service-with-aws-api-gateway-and-websockets-using-express-js-aws-lambda-321e7330c18b)

## 大事な注意

これは`AWS`上で動かすサンプルとしては不適切。
単にローカルで`WebSocket`のサーバーとクライアントを`TypeScript`で実装したサンプルとみなす。
`AWS`上で`WebSocket`を動かすサンプルは`2025-01-31-cdk-websocket-api-chat-app-tutorial`を参照。

## `wscat`のインストール

```sh
npm install -g wscat
```

## ローカルでの確認

- ローカルでのサーバーの起動

```sh
npm run dev
```

- ターミナルをもう一つ立ち上げる
- `wscat`でサーバーに接続

```sh
wscat -c ws://localhost:3000/ws
```

- メッセージを送信してサーバーから`FROM SERVER: 送った文字列`が返ってくるか確認

## 参考：`wscat`によるサーバーの立ち上げ・クライアントの接続

- ターミナルを二つ（A/Bとする）を立ち上げる
- ターミナルAでサーバーの立ち上げ

```sh
wscat -l 6000
```

- ターミナルBでクライアントの接続

```sh
wscat -c localhost:6000
```

- クライアント・サーバー双方で文字列を打ち込んで互いにメッセージが送受信されるか確認

## プロジェクトの初期化：最初の一回だけ

```sh
mkdir cdk-lambda-websocket && cd cdk-lambda-websocket
cdk init sample-app --language typescript
```

## ORIG

You should explore the contents of this project. It demonstrates a CDK app with an instance of a stack (`CdkLambdaWebsocketStack`)
which contains an Amazon SQS queue that is subscribed to an Amazon SNS topic.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build`   compile typescript to js
- `npm run watch`   watch for changes and compile
- `npm run test`    perform the jest unit tests
- `cdk deploy`      deploy this stack to your default AWS account/region
- `cdk diff`        compare deployed stack with current state
- `cdk synth`       emits the synthesized CloudFormation template
