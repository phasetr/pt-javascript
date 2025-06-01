# README

AI向け注意：作業を進めるときはまず`.clinerules`または`CONVENTIONS.md`を読むこと。

## プロジェクト概要

[指摘](https://github.com/cloudflare/workers-sdk/issues/9232#issuecomment-2909676533)をもとに,
`persistState`の挙動を確認する.
特に`pnpm`パッケージとして`db`, `hono-api`, `rr`(React Router)のパッケージを作り,
`db`には`id`と`mailaddress`だけを持つユーザーテーブルを作り,
その`D1`のローカルでのデータベースファイルが共有できるか確認する.
`hono-api`ではいわゆる`CRUD`全てのAPIを作り,
`rr`では`READ`だけできればよい.
データベースは`Prisma`を利用する.

## プロジェクトの略称

CDRH(Cloudflare D1-React router-Hono)

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
最後にステップごとの内容は`steps`ディレクトリに`年月日/時刻-step.md`として記録してください.
環境ごとに区別が必要な場合,
ローカル開発環境は`local`,
サーバー上の本番環境は`prod`として識別します.
サーバー上の環境が一つしかない場合は`prod`を採用してください.
全ての手順が終わったら`doc/manual.md`に使い方・テストの注意をまとめてください.

1. (手動)：`pnpm workspace`化する.
    - ルート直下に`package.json`と`pnpm-workspace.yaml`をコピーする
2. (手動)：`packages/hono-api`で`Hono`を初期化する
3. (手動)：`packages/rr`で`React Router`を初期化する
4. データベースのプロジェクトを作り, `Drizzle`でスキーマを作り,
   マイグレーションする.
   データベースはローカルの`D1`を利用し,
   ファイルはルート配下にディレクトリを作って各パッケージで共有する.
5. `hono-api`に`CRUD`のごく簡単なサンプルを作る.
   `D1`データベースはルート配下のディレクトリを利用する.
6. `rr`のホームにユーザー一覧を作る.
   `D1`データベースはルート配下のディレクトリを利用する.

### 自分用メモ

#### cloudflare用

`pnpm create cloudflare@latest`では、
`Framework Starter`から`React Router`を選ぶ。

```sh
npm install -g wrangler@latest

mkdir -p packages
pnpm create cloudflare@latest packages/cdrh-api \
  --framework=hono \
  --platform=workers \
  --lang=ts \
  --no-deploy \
  --no-git \
  --auto-update
mv packages/cdrh-api packages/hono-api

pnpm create cloudflare@latest rr \
  --framework=react-router \
  --platform=workers \
  --lang=ts \
  --no-deploy \
  --no-git \
  --auto-update
wrangler d1 create cdrh-db
```

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "cdrh-db",
      "database_id": "321e9293-4b2a-419b-971d-a0d44c5a98cf"
    }
  ]
}
```

`wrangler d1 create cdrh-db`で出てきた記述を`wrangler.jsonc`に追加する.

`wrangler dev --port 3000`などとすれば`wrangler`での起動でもポートが固定できるため,
必要に応じて利用すること.

##### misc

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
