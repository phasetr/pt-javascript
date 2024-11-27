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

```shell
npm create cloudflare@latest -- my-remix-app --framework=remix
```

手動デプロイ

```shell
npm run deploy
```

コマンド出力に現れる URL にアクセスする。

必要に応じてソースを追加・修正して再度手動デプロイして、正しくデプロイできているか確認する。

### `D1`データベースへのアクセス

[Configure your D1 database](https://developers.cloudflare.com/d1/get-started/)に沿う。

- `D1`データベースを作成する

```shell
npx wrangler d1 create prod-d1-my-first-remix
```

- `wrangler.toml`の`[[d1_databases]]`セクションに適切な値を記入する

- スキーマを作る

```shell
mkdir db
touch db/schema.sql
```

- まずローカルで試す

```shell
npx wrangler d1 execute prod-d1-my-first-remix --local --file=db/schema.sql
npx wrangler d1 execute prod-d1-my-first-remix --local --command="SELECT * FROM Customers"
```

- バインディングの TypeScript の型を生成

```shell
npm run typegen
```

- リモートに設定する：2024-11-27 時点で`db/schema.sql`のコマンドでエラーが出る。原因調査中。当面は`Cloudflare`の WebUI 上でクエリを実行している。

```shell
npx wrangler d1 execute prod-d1-my-first-remix --remote --file=db/schema.sql
npx wrangler d1 execute prod-d1-my-first-remix --remote --command="SELECT * FROM Customers"
```

- `routes/_index.tsx`に以下のような適当な記述を追加して`D1`から値が取れるか確認する

```typescript
import type { LoaderFunction, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";

export const loader: LoaderFunction = async ({ context, params }) => {
  const { env, cf, ctx } = context.cloudflare;
  let { results } = await env.DB.prepare("SELECT * FROM Customers").all();
  return json(results);
};

// export default function Index()内
<div>
  <h2>Welcome to Remix</h2>
  <div>
    A value from D1:
    <ul>
      {results.map(({ CustomerId, CompanyName, ContactName }) => (
        <li key={CustomerId}>
          <p>
            {CustomerId}: {CompanyName}, {ContactName}
          </p>
        </li>
      ))}
    </ul>
  </div>
</div>;
```

### 作った環境の削除

```shell
npx wrangler d1 delete prod-d1-my-first-remix
npx wrangler delete
```

削除がうまくいかない場合は WebUI から直接削除する。

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
