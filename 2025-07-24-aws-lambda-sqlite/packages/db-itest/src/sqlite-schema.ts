/**
 * @fileoverview SQLite schema definition for sql.js integration tests
 */
import { real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const randoms = sqliteTable("randoms", {
	id: text("id").primaryKey(),
	random_value: real("random_value").notNull(),
	created_at: text("created_at").notNull(),
});

export type SelectRandom = typeof randoms.$inferSelect;
export type InsertRandom = typeof randoms.$inferInsert;
