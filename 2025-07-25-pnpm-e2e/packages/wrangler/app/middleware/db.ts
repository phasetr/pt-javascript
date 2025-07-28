import * as schema from "@pnpm-e2e/core/db/schema";
import { drizzle } from "drizzle-orm/d1";
import type { Context, Next } from "hono";
import type { Bindings, Variables } from "../types/bindings";

export async function dbMiddleware(
	c: Context<{ Bindings: Bindings; Variables: Variables }>,
	next: Next,
) {
	const db = drizzle(c.env.DB, { schema });
	c.set("db", db);
	await next();
}
