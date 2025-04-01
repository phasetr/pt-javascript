# README

AI向け注意：作業を進めるときはまず`.clinerules`を読むこと。

## プロジェクト概要

Cloudflare上で`Hono`による`WebSocket`サーバーが動くかどうか検証する.
検証目的なため, `Hono`でファイル一枚におさまる極シンプルな実装でよい.

## プロジェクトの略称

CWH(Cloudflare WebSocket Hono)

## 基本的なインフラ

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

1. (手動)：`Cloudflare`用プロジェクトを初期化する
2. `Hono`の`public`の`index.html`を削除してAPIサーバーに特化させる
3. `Hono`の`WebSocket`サーバーを実装してローカルで確認する
4. デプロイしてサーバー上での動作を確認する
5. 環境を削除する

### 自分用(都度消す)

Clineへの定型文：まず.clinerulesを読んでください。
いまREADME.mdの作業手順に関して進めたステップを確認し,
次のステップの作業を始めてください。
ワンステップだけ対応して、二つ以上のステップを一気に進めないでください。

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

アカウントの確認

```sh
wrangler whoami
```

アカウントの切り替え

```sh
wrangler logout
wrangler login
```
