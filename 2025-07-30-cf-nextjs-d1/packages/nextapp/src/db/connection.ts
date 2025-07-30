import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDB() {
	// @ts-ignore - This will be available in the Cloudflare environment
	const DB = globalThis.DB;
	if (!DB) {
		throw new Error("Database binding not found");
	}
	return drizzle(DB, { schema });
}

export type Database = ReturnType<typeof getDB>;
