# Welcome to your CDK TypeScript project

- [記事：AWS CDKでWebSocketを使ったサーバーレスチャットアプリを作る](https://www.fourier.jp/blog/building-chat-app-with-websocket-api-using-aws-cdk)
- [GitHub](https://github.com/fourierLab/websocket-api-chat-app-tutorial)

## チャットアプリを実行する

```sh
cdk deploy
```

- ターミナルを二つ立ち上げて両方で`wscat`を実行する

```sh
URL=$(aws cloudformation describe-stacks --stack-name WebsocketApiChatAppTutorialStack --query "Stacks[0].Outputs[?OutputKey=='WSACATMessageApiUrl'].OutputValue" --output text)
wscat -c "$URL"
```

- 一方から次のように入力し、もう片方にメッセージが現れるか確認する

```sh
{"action": "send-message", "message": "hello!"}
```

## ORIG

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build`   compile typescript to js
- `npm run watch`   watch for changes and compile
- `npm run test`    perform the jest unit tests
- `cdk deploy`      deploy this stack to your default AWS account/region
- `cdk diff`        compare deployed stack with current state
- `cdk synth`       emits the synthesized CloudFormation template
