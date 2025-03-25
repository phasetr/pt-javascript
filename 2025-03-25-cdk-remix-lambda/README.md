# README

- オリジナル：[AWS CDKを用いてRemixアプリケーションをLambdaにデプロイする](https://zenn.dev/monjara/articles/38443c05723f1b)
- <https://gallery.ecr.aws/docker/library/node>

## 概要

`create-remix@latest`しただけの`Remix`アプリを`Docker`利用で`Lambda`にデプロイしたサンプル。
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

## memo

```sh
mkdir remix && cd remix
npx create-remix@latest

# プロジェクトルートに戻る

mkdir cdk && cd cdk
cdk init app --language typescript
```
