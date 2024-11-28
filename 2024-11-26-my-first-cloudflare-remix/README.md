# README

- [参考](https://zenn.dev/necocoa/articles/remix-v2-with-cloudflare-pages-d1)
- 📖 [Remix docs](https://remix.run/docs)
- 📖 [Remix Cloudflare docs](https://remix.run/guides/vite#cloudflare)

## `wrangler`の導入

### `wrangler`のインストールとバージョン確認

```shell
npm install wrangler --save-dev
npx wrangler -v
```

### `wrangler`でログイン

```shell
npx wrangler whoami
npx wrangler login
npx wrangler whoami
```

## サンプル 1

- [Cloudflare 公式 Remix 導入](https://developers.cloudflare.com/pages/framework-guides/deploy-a-remix-site/)

### プロジェクトの初期化

- このリポジトリを前提にするなら以下のコマンドは発行不要

```shell
npm create cloudflare@latest -- remix-first-sample --framework=remix
```

### `D1`の環境構築

[Configure your D1 database](https://developers.cloudflare.com/d1/get-started/)に沿う。

- クラウド上に`D1`データベースを作成する

```shell
npx wrangler d1 create remix-first-sample
```

- 出力結果の値を`wrangler.toml`の`[[d1_databases]]`に記録する
  - `TODO`：秘匿するべきはずの値を直接書くのが嫌。
    `.env`や`wrangler pages secret put DATABASE_NAME`で設定した値を読み込む方法を探す
- ローカルへのコマンド発行（下記コマンドで生成される`SQLite`は`.wrangler/state/<version>/d1`に置かれる

```shell
npx wrangler d1 execute DB --local --file=db/schema.sql
npx wrangler d1 execute DB --local --command="SELECT * FROM Customers"
```

- バインディングの`TypeScript`の型を生成

```shell
npm run typegen
```

- `D1`のリモートを作成・データ投入

```shell
npx wrangler d1 execute remix-first-sample --remote --file=db/schema.sql
npx wrangler d1 execute remix-first-sample --remote --command="SELECT * FROM Customers"
```

### ローカルでの`D1`データベースへのアクセス確認

- ローカル環境で正しく動くか確認する

```shell
npm run dev
```

- リモートにデプロイ

```shell
npm run deploy
```

- 出力結果の`URL`から適切に`D1`アクセスができているか確認

### 作った環境の削除

```shell
npx wrangler d1 delete remix-first-sample
npx pages wrangler remix-first-sample delete
```

- 削除がうまくいかない場合は`WebUI`から直接削除する。

## サンプル 2（うまくいっていない）

- [参考](https://zenn.dev/necocoa/articles/remix-v2-with-cloudflare-pages-d1)

### `Remix`の初期化

```shell
npx create-remix@latest remix \
  --template remix-run/remix/templates/cloudflare \
  --no-git-init
```

ローカルでの立ち上げ

```shell
npm run dev
```

デプロイ

```shell
npm run deploy
```

## Development

Run the dev server:

```sh
npm run dev
```

To run Wrangler:

```sh
npm run build
npm run start
```

## Typegen

Generate types for your Cloudflare bindings in `wrangler.toml`:

```sh
npm run typegen
```

You will need to rerun typegen whenever you make changes to `wrangler.toml`.

## Deployment

First, build your app for production:

```sh
npm run build
```

Then, deploy your app to Cloudflare Pages:

```sh
npm run deploy
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.
