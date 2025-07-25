import type { Config } from "drizzle-kit";

export default {
	schema: "../core/src/db/schema.ts",
	out: "../core/migrations",
	dialect: "sqlite",
	dbCredentials: {
		url: "../../dev.db", // プロジェクトルートに配置
	},
} satisfies Config;
