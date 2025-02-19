# Welcome to your CDK TypeScript project

- 2024-09-21, [Building a Real-Time Chat Service with AWS API Gateway and WebSockets Using Express.js & AWS Lambda](https://medium.com/@sonishubham65/building-a-real-time-chat-service-with-aws-api-gateway-and-websockets-using-express-js-aws-lambda-321e7330c18b)

## 大事な注意

`fastify`を利用したローカルでの`WebSocket`のサンプルは`src/ws`にあり、
ローカルでは適切に動作する一方でこれをそのまま`AWS`上にデプロイできない模様（調査中）。
`AWS`上で動かすサンプルは`src/lambda`にあり、
実際に`lib`でデプロイしているソースはこちら。

## `wscat`のインストール

```sh
npm install -g wscat
```

## `AWS`でのテスト

### `ExpressConstruct`

- `src/express`、特に`index.prod.ts`を利用：ローカルでは動かず、あくまで`AWS Lambda`上で動かす前提のコード

立ち上がった`wscat`で単純にメッセージ（例えば`test`）を送信する：次のようなメッセージが来れば良い。

```sh
OUTPUT_KEY=$(aws cloudformation describe-stacks --stack-name CdkLambdaWebsocketStack --query "Stacks[0].Outputs[0].OutputKey" --output text)
URL=$(aws cloudformation describe-stacks --stack-name CdkLambdaWebsocketStack --query "Stacks[0].Outputs[?OutputKey=='${OUTPUT_KEY}'].OutputValue" --output text)
wscat -c "$URL"
```

>{"action": "sendMessage", "data": "Hello World"}

これで次のような文字列がサーバーから返って来れば良い：多少（10秒程度？）時間がかかる。

>{"data":{"message":"OK Done, your message is 'Hello World'"},"status":200}

### `LambdaConstruct`

- `src/lambda`のコードを利用：ローカルでは動かず、あくまで`AWS Lambda`上で動かす前提のコード

```sh
OUTPUT_KEY=$(aws cloudformation describe-stacks --stack-name CdkLambdaWebsocketStack --query "Stacks[0].Outputs[0].OutputKey" --output text)
URL=$(aws cloudformation describe-stacks --stack-name CdkLambdaWebsocketStack --query "Stacks[0].Outputs[?OutputKey=='${OUTPUT_KEY}'].OutputValue" --output text)
wscat -c "$URL"
```

立ち上がった`wscat`で単純にメッセージ（例えば`test`）を送信する：次のようなメッセージが来れば良い。

>Use the send-message route to send a message. Your info:{"ConnectedAt":"2025-02-03T01:46:33.523Z","Identity":{"SourceIp":"自分のIP","UserAgent":null},"LastActiveAt":"2025-02-03T01:46:36.076Z","connectionId":"FYnvDeD_NjMCKlg="}
>Disconnected (code: 1001, reason: "Going away")

次のように`action`を`send-message`にしてメッセージを送信する。

>{"action": "send-message", "message": "Hello, world!"}

これに対して次のようなメッセージが来れば良い。

>{"message":"FROM AWS: your message is 'Hello, world!'"}

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
