# README

AI向け注意：作業を進めるときはまず`.clinerules`を読むこと。

## プロジェクト概要

メール送信用にAWSで`SNS`を立ち上げる.
Cloudflare上でキューイングサービスとHono製のWebサーバーを作り,
キューを詰めてCloudflare上のWebサーバーから`AWS SNS`を叩いてメールを送信する.
いつ送ったか明確になるように,
メールのタイトル・内容は`JST`での送信時刻を含める.

## プロジェクトの略称

CCQM(Cloudflare Cdk Queue Mail)

## 基本的なインフラ

- `AWS`
- `Cloudflare`

## 作業手順

### AI用

各ステップごとに人手で目視・手動で確認します.
必ず次の手順で作業し,
各ステップで止めてください.
ステップ終了時は何を確認するべきか箇条書きにしてください.
結果確認用に適切なjsまたはtsプログラム(jsまたはtsファイル)としてまとめ,
得られるべき結果と実際の値を比較する部分もプログラムにおさめてください.
日時のように都度得られるべき結果が変わる場合は適切な比較対象を設定してください.
最後にステップごとの内容は`steps`ディレクトリに`年月日-時間-step.md`として記録してください.

1. (手動)：`pnpm workspace`化する.
    - ルート直下に`package.json`と`pnpm-workspace.yaml`をコピーする
2. (手動)：`packages/ccqm`に`cdk init`する
3. (手動)：`packages/hono-api`で`Hono`を初期化する
4. `CDK`で`SNS`を設定する
   環境としては`dev`だけを作る.
   スペックとしては最低限でよい.
   指定した構成でAWSにデプロイする.
   `AWS SDK`を利用したスクリプトで`SNS`を利用したメールが送れるか確認する
5. `packages/hono-api`で`SNS`を利用したメール送信機能を追加する.
   実際にメール送信できるか確認する.
6. `Cloudflare Queues`を設定して`packages/hono-api`を呼び出すようにする
7. ローカル・Cloudflare・AWS上の開発環境に対する簡易結合テストを作成する。
   APIは全てを一通り叩いて結果が返るか確認する。
   環境指定で`local`・`dev`を選べるようにし、適切な環境を指定して簡易結合テストできるようにする.
   この指定がない場合は自動的に`local`になるとする。

### 自分用(都度消す)

Clineへの定型文：まず.clinerulesを読んでください。
いまREADME.mdの作業手順に関して進めたステップを確認し,
次のステップの作業を始めてください。
ワンステップだけ対応して、二つ以上のステップを一気に進めないでください。

#### AWS用

```sh
mkdir -p packages/<proj-name>
cdk init sample-app --language typescript
```

#### cloudflare用

```sh
mkdir <proj-name>
cd <proj-name>
npm create cloudflare@latest -- --framework=hono
npm create cloudflare@latest -- --framework=remix
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
