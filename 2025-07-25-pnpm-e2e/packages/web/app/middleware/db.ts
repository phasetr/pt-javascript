import type { D1Database } from "@cloudflare/workers-types";
import { type Database, schema } from "@pnpm-e2e/core";
import { drizzle } from "drizzle-orm/d1";

export interface DatabaseConfig {
	d1Database?: D1Database;
}

export async function createDatabase(
	config: DatabaseConfig,
): Promise<Database> {
	if (!config.d1Database) {
		throw new Error("D1Database is required to create a Database instance");
	}
	return drizzle(config.d1Database, { schema });
}
