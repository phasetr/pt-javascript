# README

- メモ用：[参考にしたリポジトリ](https://github.com/mizchi/ailab)

AI向け注意：作業を進めるときはまず`.clinerules`を読むこと。

## プロジェクト概要

Cloudflare上のRemixでBasic認証を確認するだけ

## プロジェクトの略称

CRBA(Cloudflare Remix Basic Auth)

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

1. (手動)：`cloudflare cli`で`Remix`初期化・初期リリース
2. (手動)：`Remix`にベーシック認証を追加する。
   特にRemixのサーバーサイドエントリーポイント`entry.server.tsx`にBasic認証のコードを追加すれば良い
3. ローカル・サーバー双方でBasic認証の動作を確認
4. Cloudflare上の環境を削除

### 自分用(都度消す)

Clineへの定型文：まず.clinerulesを読んでください。
いまREADME.mdの作業手順に関して進めたステップを確認し,
次のステップの作業を始めてください。
ワンステップだけ対応して、二つ以上のステップを一気に進めないでください。

cloudflare用

```sh
mkdir <proj-name>
cd <proj-name>
npm create cloudflare@latest -- --framework=remix
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
