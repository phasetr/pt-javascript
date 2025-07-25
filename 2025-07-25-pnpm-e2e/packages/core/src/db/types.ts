import type {
	BaseSQLiteDatabase,
	SQLiteTableWithColumns,
	TableConfig,
} from "drizzle-orm/sqlite-core";

/**
 * データベースドライバの型定義
 */
export type Database = BaseSQLiteDatabase<
	"sync" | "async",
	unknown,
	Record<string, SQLiteTableWithColumns<TableConfig>>
>;
