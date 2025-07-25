import type { drizzle } from "drizzle-orm/d1";
import type { schema } from "./schema.js";

/**
 * D1データベース型
 */
export type Database = ReturnType<typeof drizzle<typeof schema>>;
