import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * numbersテーブルのスキーマ定義
 */
export const numbers = sqliteTable("numbers", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	number: integer("number").notNull(),
	createdAt: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text("updated_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString())
		.$onUpdateFn(() => new Date().toISOString()),
});

export const schema = {
	numbers,
};
