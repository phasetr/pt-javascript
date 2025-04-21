# README

AI向け注意：作業を進めるときはまず`.clinerules`を読むこと。

## プロジェクト概要

Cloudflare上にHonoによるAPIサーバーを立てる.
特にGoogle認証を利用してAPIを保護するサンプルを作る.
Google認証の対象は`phasetr@gmail.com`だけを前提にする.
本来はデータベース(`D1`)を利用するべきだが,
実装とインフラを簡潔にするためメールアドレスはハードコードにする.

## プロジェクトの略称

CGAA(Cloudflare Google Auth API)

## 基本的なインフラ

- `Cloudflare`

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
環境ごとに区別が必要な場合,
ローカル開発環境は`local`,
サーバー上の本番環境は`prod`として識別します.
全ての手順が終わったら`doc/manual.md`に使い方・テストの注意をまとめてください.

1. (手動)：`pnpm workspace`化する.
    - ルート直下に`package.json`と`pnpm-workspace.yaml`をコピーする
2. (手動)：`packages/hono-api`で`Hono`を初期化する
3. 認証なしで使えるエンドポイントと認証が必要なエンドポイントを一つずつ作る.
4. 環境を削除する

### 自分用(都度消す)

#### cloudflare用

```sh
npm install -g wrangler@latest

mkdir -p packages/hono-api
cd packages/hono-api
pnpm create cloudflare@latest -- --framework=hono
mv packages/hono-api packages/hono-api
```

`wrangler dev --port 3000`などとすれば`wrangler`での起動でもポートが固定できるため,
必要に応じて利用すること.

機密情報の設定・削除

```sh
wrangler secret put <KEY>
wrangler secret delete <KEY>
```

`wrangler.jsonc`を書き換えたら次のコマンドを実行

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
