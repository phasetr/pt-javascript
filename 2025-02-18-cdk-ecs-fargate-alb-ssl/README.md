# Welcome to your CDK TypeScript project

- [ORIGINAL](https://github.com/twilio-samples/speech-assistant-openai-realtime-api-node)
- 参考メモ：[2024-10-29 Realtime APIとTwilioを用いた電話予約デモシステムの構築](https://www.ai-shift.co.jp/techblog/4980)
- `ECS+Fargate`に`SSL`をつけて`AWS`に公開し, `Twilio`から呼んでいる.

## TODO

- (自動で`HTTPS`が適用される)`Lambda`で動かせないか再検討.
- `Cloudflare`で動かせるか調査.

## 初期設定

- ルート直下の`.env.example`をコピーした`.env`に情報を記入.
  2025-02-17時点では`CEFAS_SERVICE_URL=academic-event.com`にすること.
- (**ローカルで動かしたい場合**)`app`直下の`.env.example`をコピーした`.env`に情報を記入.
  `SERVICE_URL`は`Twilio`がアクセスできるようにするため,
  `ngrok`などを利用して公開した`URL`を設定する.

## ローカルで動かす

- `app`ディレクトリに移動する.
- 以下のコマンドを実行する.

```sh
npm install
npm run dev
```

- (必要に応じて別ターミナルを開いて)`ngrok`をインストールする.
- 以下のコマンドを実行する.

```sh
ngrok http 3000
```

- `Twilio`のコンソールにログインする.
- 適切な電話番号を控えておく.
- `United States > Phone Numbers > Active Numbers`から適切な電話番号を入力を選ぶ.
- `A call comes in`の`URL`に`ngrok`の`URL`+`/incoming-call`を指定して保存する.
- 適切な番号に電話をかける.

## CDK

### HTTPS用のドメイン登録

- 適当なドメインを`ACM`・`Route 53`で設定。
- `HostedZone`の名前を適切に設定した上で以下のコマンドで登録されているか確認する。

```sh
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='👺PROPER_URL👺'].Id" --output text) && echo ${HOSTED_ZONE_ID}
aws acm list-certificates --output json
```

### デプロイ前（初回）にシークレットを導入

- 利用`AWS`アカウントが適切か確認する.
- `.env.sample`をコピーして`.env`を作る.
- `.env`に適切なデータを記入（`CEFAS_SERVICE_URL`は一度デプロイしないと正しい値が取得できない）.
- 次のコマンドを実行してシークレットを投入.

```sh
npm run us
```

- 次のコマンドを実行してシークレットが投入されたか確認

```sh
npm run check
```

- **重要な注意**：`Secrets Manager`でシークレットを設定するとき,
  値はキー・バリューではなくプレーンテキストでシークレットの値を貼り付けること.
  AWS上で値を取得しようとした時にローカルと挙動が変わって混乱する.

### デプロイ

```sh
cdk deploy
```

### Webサービスの動作確認

```sh
URL=👺PROPER_URL👺 && echo ${URL}
curl https://${URL}
curl https://${URL}/incoming-call
wscat -c wss://${URL}/media-stream
```

## ORIG

You should explore the contents of this project. It demonstrates a CDK app with an instance of a stack (`TwilioOpenaiRealtimeApiDevStack`)
which contains an Amazon SQS queue that is subscribed to an Amazon SNS topic.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build`   compile typescript to js
- `npm run watch`   watch for changes and compile
- `npm run test`    perform the jest unit tests
- `cdk deploy`      deploy this stack to your default AWS account/region
- `cdk diff`        compare deployed stack with current state
- `cdk synth`       emits the synthesized CloudFormation template
