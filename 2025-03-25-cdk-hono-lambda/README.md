# README

- オリジナル, `Hono`公式：[AWS Lambda](https://hono.dev/docs/getting-started/aws-lambda)

## 概要

`npm create hono@latest`しただけの`Hono`アプリを`Docker`利用で`Lambda`にデプロイしたサンプル。
`CommonJS`にせず`type: module`のままで良い。

## デプロイ

```sh
cd cdk
cdk deploy
```

動作確認

```sh
open $(aws cloudformation describe-stacks --stack-name CdkStack --query "Stacks[0].Outputs[?OutputKey=='CRLApiEndpoint'].OutputValue" --output text)
```

## 初期化

```sh
npm create hono@latest hono-api

# プロジェクトルートに戻る

mkdir cdk && cd cdk
cdk init app --language typescript
```
