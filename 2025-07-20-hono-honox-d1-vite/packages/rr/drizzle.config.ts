import type { Config } from "drizzle-kit";

export default {
  schema: "./app/db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: {
    // wranglerがローカルで作成するD1データベースファイルを指定
    url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/cc04bb6cd24b30b16f85e2017dbc36fa6f11d632505e39e58c7a23464350f3ac.sqlite",
  },
} satisfies Config;
