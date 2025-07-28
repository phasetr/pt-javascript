import type { drizzle as d1Drizzle } from "drizzle-orm/d1";
import type { drizzle as sqlJsDrizzle } from "drizzle-orm/sql-js";
import type * as schema from "./schema.js";

/**
 * 統一データベース型 - D1/sql.js両対応
 */
export type Database =
	| ReturnType<typeof d1Drizzle<typeof schema>>
	| ReturnType<typeof sqlJsDrizzle<typeof schema>>;
