import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: {
    // ローカル開発時は共有永続化ディレクトリ内のSQLiteファイルを使用
    url: "../../.wrangler-persist/v3/d1/miniflare-D1DatabaseObject/sample-db.sqlite",
  },
});
