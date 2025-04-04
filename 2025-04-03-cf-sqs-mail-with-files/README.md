# README

AI向け注意：作業を進めるときはまず`.clinerules`を読むこと。

## プロジェクト概要

`Cloudflare`から`AWS SDK`がうまく使えず直接`SES`が利用できない可能性がある.
そこでキューイングから`AWS`に任せ,
`200KB`程度の文字列を`SQS`に渡した上で,
`SQS`+`Lambda`+`SES`で渡した文字列と,
この文字列から生成した添付ファイルを持つメールが送れるか検証する.

## プロジェクトの略称

CSMWF(Cloudflare SQS Mail With Files)

## 基本的なインフラ

- `AWS`
- `Cloudflare`

## アプリケーション起動・テストマニュアル

`doc/manual.md`参照。

## 作業手順

### AI用

各ステップごとに人手で目視・手動で確認します.
必ず次の手順で作業し,
各ステップで止めてください.
ステップ終了時は何を確認するべきか箇条書きにしてください.
結果確認用に適切な`typescript`のプログラムとしてまとめ,
得られるべき結果と実際の値を比較する部分もプログラムにおさめてください.
設計・実装方針としてできる限り副作用,
とりわけ環境変数は利用せず,
環境変数を利用する場合は関数の引数として与えるようにし,
関数の純粋性・テスタビリティを確保してください.
テスト用スクリプトも原則として`typescript`で書いて実行してください.
日時のように都度得られるべき結果が変わる場合は適切な比較対象を設定してください.
最後にステップごとの内容は`steps`ディレクトリに`年月日-時間-step.md`として記録してください.
環境指定はローカル開発環境は`local`,
サーバー上の環境は一つしか考えないためこれは`prod`を採用してください.
全ての手順が終わったら`doc/manual.md`に使い方・テストの注意をまとめてください.

1. (手動)：`pnpm workspace`化する.
    - ルート直下に`package.json`と`pnpm-workspace.yaml`をコピーする
2. (手動)：`packages/<プロジェクトの略称>`に`cdk init`する
3. (手動)：`packages/hono-api`で`Hono`を初期化する
4. 今のコードベースで`CDK`コードを書き換える.
   環境としては`prod`を作る.
   どちらもスペックとしては最低限でよい.
   指定した構成でAWSにデプロイする.
5. 「クライアントとサーバーのやり取り」をクライアント,
   サーバーの順に行で区切った200KB程度のファイルを作り,
   それを文字列として読み込む形で文字列を準備し,
   それを`SQS`に渡して`Lambda`から`SES`で指定したメールアドレスにメールを送れるか検証する.
6. 上記の処理がローカルで`wrangler dev`で起動した`Hono`サーバー,
   さらにそれをCloudlareにデプロイした状態から類似のメールを送れるか検証する.
7. 環境を削除する

### 自分用(都度消す)

Clineへの定型文：まず.clinerulesを読んでください。
いまREADME.mdの作業手順に関して進めたステップを確認し,
次のステップの作業を始めてください。
ワンステップだけ対応して、二つ以上のステップを一気に進めないでください。

#### AWS用

```sh
corepack enable && corepack prepare pnpm@latest --activate
asdf reshim nodejs
pnpm -v
pnpm init

mkdir -p packages/<proj-name>
cdk init sample-app --language typescript
npm create hono@latest packages/hono-api
npx create-remix@latest packages/remix
```

#### cloudflare用

```sh
npm install -g wrangler@latest

mkdir <proj-name>
cd <proj-name>
npm create cloudflare@latest -- --framework=hono
npm create cloudflare@latest -- --framework=remix
```

`Hono`の`Cloudflare`用シークレット設定：
先に`.dev.vars.sample`から`.dev.vars`を作ってそこに値を埋めておこう。

```sh
# SQS_QUEUE_URLを取得するコマンド
aws sqs get-queue-url --queue-name CSMWF-prod-Queue --region ap-northeast-1 --output text

cd packages/hono-api
wrangler secret put AWS_ACCESS_KEY_ID
wrangler secret put AWS_SECRET_ACCESS_KEY
wrangler secret put AWS_REGION
wrangler secret put SQS_QUEUE_URL
```

機密情報の設定・削除

```sh
wrangler secret put <KEY>
wrangler secret delete <KEY>
```

`wrangler.toml`を書き換えたら次のコマンドを実行

```sh
npm run typegen
```

```sh
npm run deploy
```

```sh
wrangler delete
```

アカウントの確認

```sh
wrangler whoami
```

アカウントの切り替え

```sh
wrangler logout
wrangler login
```
