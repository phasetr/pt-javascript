import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
	BaseSQLiteDatabase,
	SQLiteTableWithColumns,
	TableConfig,
} from "drizzle-orm/sqlite-core";
import type { numbers } from "./schema.js";

/**
 * numbersテーブルのselect型
 */
export type NumbersSelect = InferSelectModel<typeof numbers>;

/**
 * numbersテーブルのinsert型
 */
export type NumbersInsert = InferInsertModel<typeof numbers>;

/**
 * データベースドライバの型定義
 */
export type Database = BaseSQLiteDatabase<
	"sync" | "async",
	unknown,
	Record<string, SQLiteTableWithColumns<TableConfig>>
>;
