import type { Config } from "drizzle-kit";

export default {
	schema: "../core/src/db/schema.ts",
	out: "../core/migrations",
	dialect: "sqlite",
	dbCredentials: {
		url: "../../.wrangler-persist/v3/d1/miniflare-D1DatabaseObject/ptdev.sqlite", // D1ローカルデータベースのパス
	},
} satisfies Config;
