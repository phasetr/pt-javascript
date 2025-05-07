## Cloudflareインフラ

`AWS`と違って`wrangler secret put <KEY>`による`Cloudflare Workers Secrets`の値がローカルで取得できないため,
`wrangler dev`での`.dev.vars`読み込みを利用する.
`Cloudflare`上の環境では`Cloudflare Workers Secrets`の値が使えるように適切に実装する.

### 複数パッケージにまたがって`D1`を利用するとき

特に`ORM`として`drizzle`(と`drizzle-kit`)を利用する前提とする.

- `db`パッケージを作成し, マイグレーションファイル・ORM設定・サービスクラスはこのパッケージにまとめる
- 複数のパッケージが同じD1データベースを参照する場合,
  ローカル開発環境ではルート直下の`.wrangler-persist`ディレクトリを共有・利用する.
- `db/drizzle.config.ts`では次のように設定する.

    ```typescript
    // packages/db/drizzle.config.ts
    export default {
      schema: "./src/schema.ts",
      out: "./migrations",
      dialect: "sqlite",
      dbCredentials: {
        // ローカル開発時は共有永続化ディレクトリ内のSQLiteファイルを使用
        url: "../../.wrangler-persist/v3/d1/miniflare-D1DatabaseObject/f253421848505bfd644490698e36d17977501ad2587c6ba0fd479180a316f09a.sqlite",
      },
    } satisfies Config;
    ```

- 各パッケージの`wrangler.jsonc`ファイルでは同じ`database_id`を指定する：これは`wrangler d1 create`時に表示された値,
  または`Cloudflare`のコンソールで確認できる値を指定すればよい.

    ```jsonc
    // packages/rr/wrangler.jsonc・packages/hono-api/wrangler.jsoncなど
    {
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": "crd-sample-db",
          "database_id": "f2883ac9-8383-40c2-956c-4be15f5cc9de",
          "migrations_dir": "../db/migrations"
        }
      ]
    }
    ```

- ローカル開発時は`--persist-to`オプションで永続化ディレクトリを明示的に指定する.

    ```bash
    wrangler dev --persist-to ../../.wrangler-persist
    ```

- ルートの`package.json`には次のようなスクリプトを指定する.

    ```json
      "scripts": {
      	"db:studio": "cd packages/db && drizzle-kit studio",
      	"db:studio:kill": "kill $(lsof -t -i:4983)",
      	"db:generate": "cd packages/db && drizzle-kit generate",
      	"db:push:local": "cd packages/db && drizzle-kit push:sqlite --config=drizzle.config.ts",
      	"db:push:prod": "cd packages/db && drizzle-kit push:sqlite --config=drizzle.config.ts",
      	"db:migrate:local": "cd packages/rr && wrangler d1 migrations apply DB --local --persist-to ../../.wrangler-persist",
      	"db:migrate:prod": "cd packages/rr && wrangler d1 migrations apply DB"
      }
    ```
