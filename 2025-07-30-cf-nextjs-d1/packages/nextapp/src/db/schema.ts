import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const numbers = sqliteTable("numbers", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	number: integer("number").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type Number = typeof numbers.$inferSelect;
export type InsertNumber = typeof numbers.$inferInsert;
