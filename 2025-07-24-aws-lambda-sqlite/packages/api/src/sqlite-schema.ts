/**
 * @fileoverview SQLite schema definition using Drizzle ORM
 */
import { real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Randoms table schema for SQLite
 * Mirrors the RandomEntity structure from DynamoDB but in relational format
 */
export const randoms = sqliteTable("randoms", {
	id: text("id").primaryKey(),
	random_value: real("random_value").notNull(),
	created_at: text("created_at").notNull(),
});

/**
 * Type definition for randoms table select operations
 */
export type SelectRandom = typeof randoms.$inferSelect;

/**
 * Type definition for randoms table insert operations
 */
export type InsertRandom = typeof randoms.$inferInsert;
