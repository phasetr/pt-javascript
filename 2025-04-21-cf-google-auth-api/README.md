# README

AI向け注意：作業を進めるときはまず`.clinerules`を読むこと。

## プロジェクト概要

Cloudflare上にHonoによるAPIサーバーを立てる.
特にGoogle認証を利用してAPIを保護するサンプルを作る.
Google認証の対象は`phasetr@gmail.com`だけを前提にする.
本来はデータベース(`D1`)を利用するべきだが,
単にサンプル作成目的でしかなく,
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

## テスト実行方法

プロジェクトには単体テストと結合テストが含まれています。

### 単体テスト

単体テストは外部サービスに依存せず、モックを使用してテストを行います。

```sh
# ルートディレクトリから実行
pnpm hono:cf:test:unit

# または packages/hono-api ディレクトリから実行
pnpm test:unit
```

### 結合テスト

結合テストは実際に動作しているサーバーに対してテストを行います。
テスト実行前に別のターミナルでサーバーを起動しておく必要があります。

```sh
# ターミナル1: サーバーを起動
pnpm hono:cf:dev

# ターミナル2: 結合テストを実行
pnpm hono:cf:test:integration
```

### すべてのテストを実行

```sh
# ルートディレクトリから実行
pnpm hono:cf:test

# または packages/hono-api ディレクトリから実行
pnpm test
```
