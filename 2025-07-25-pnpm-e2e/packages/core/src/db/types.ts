import type { drizzle as drizzleSqlJs } from "drizzle-orm/sql-js";
import type {
	BaseSQLiteDatabase,
	SQLiteTableWithColumns,
	TableConfig,
} from "drizzle-orm/sqlite-core";
import type { schema } from "./schema.js";

/**
 * 汎用データベースドライバの型定義
 */
export type BaseDatabase = BaseSQLiteDatabase<
	"sync" | "async",
	unknown,
	Record<string, SQLiteTableWithColumns<TableConfig>>
>;

/**
 * sql.js専用のデータベース型
 */
export type SqlJsDatabase = ReturnType<typeof drizzleSqlJs<typeof schema>>;

/**
 * 統合データベース型（sql.js/D1/その他のSQLite実装に対応）
 */
export type Database = BaseDatabase | SqlJsDatabase;
