import type { Context, Next } from "hono";
import { getDatabase, setupDatabase } from "../../src/db/setup.js";

let isInitialized = false;

export async function dbMiddleware(c: Context, next: Next) {
	if (!isInitialized) {
		await setupDatabase();
		isInitialized = true;
	}

	const db = getDatabase();
	c.set("db", db);
	await next();
}
