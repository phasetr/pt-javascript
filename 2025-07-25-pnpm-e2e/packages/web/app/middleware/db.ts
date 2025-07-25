import type { D1Database } from "@cloudflare/workers-types";
import { type Database, schema } from "@pnpm-e2e/core";
import { drizzle } from "drizzle-orm/d1";
import type { Context, MiddlewareHandler } from "hono";

export interface DatabaseConfig {
	d1Database?: D1Database;
}

export async function createDatabase(
	config: DatabaseConfig,
): Promise<Database> {
	try {
		if (!config) {
			throw new Error("Database configuration is required");
		}
		if (!config.d1Database) {
			throw new Error("D1Database is required to create a Database instance");
		}
		return drizzle(config.d1Database, { schema });
	} catch (error) {
		console.error("Error creating database:", error);
		throw error;
	}
}

export const dbMiddleware: MiddlewareHandler = async (
	c: Context,
	next: () => Promise<void>,
) => {
	const db = await createDatabase({ d1Database: c.env.DB });
	c.set("db", db);
	await next();
};
