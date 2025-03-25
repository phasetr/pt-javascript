# README

- オリジナル, `Hono`公式：[AWS Lambda](https://hono.dev/docs/getting-started/aws-lambda)

オリジナルは`ECR`ではなく`NodejsFunction`を使っている。

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
curl $(aws cloudformation describe-stacks --stack-name CHLCdkStack --query "Stacks[0].Outputs[?OutputKey=='CHLHonoApiEndpoint'].OutputValue" --output text)
```

結果：

>`Hello Hono!`

## 初期化

```sh
npm create hono@latest hono-api

# プロジェクトルートに戻る

mkdir cdk && cd cdk
cdk init app --language typescript
```
