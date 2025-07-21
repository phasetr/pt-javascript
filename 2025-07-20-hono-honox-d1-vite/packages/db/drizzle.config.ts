import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "file:../../.wrangler-persist/v3/d1/local-db.sqlite",
  },
} satisfies Config;
