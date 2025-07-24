/**
 * @fileoverview SQLite operations using sql.js for integration tests
 */

import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/sql-js";
import initSqlJs from "sql.js";
import {
	type InsertRandom,
	randoms,
	type SelectRandom,
} from "./sqlite-schema.js";

export type SqlJsDatabase = ReturnType<typeof drizzle<Record<string, never>>>;
export type { SelectRandom, InsertRandom };

/**
 * Create in-memory SQLite database with sql.js and Drizzle ORM
 * @returns Drizzle database instance with sql.js
 */
export async function createSqliteDb(): Promise<SqlJsDatabase> {
	const SQL = await initSqlJs();
	const sqliteDb = new SQL.Database();
	const db = drizzle(sqliteDb);

	// Create tables
	sqliteDb.exec(`
		CREATE TABLE IF NOT EXISTS randoms (
			id TEXT PRIMARY KEY,
			random_value REAL NOT NULL,
			created_at TEXT NOT NULL
		)
	`);

	return db;
}

/**
 * Insert a single random record into SQLite
 * @param db - Drizzle database instance
 * @param record - Random record to insert
 * @returns Promise resolving to inserted record
 */
export async function insertRandomRecord(
	db: SqlJsDatabase,
	record: InsertRandom,
): Promise<SelectRandom> {
	const result = await db.insert(randoms).values(record).returning();
	const insertedRecord = result[0];
	if (!insertedRecord) {
		throw new Error("Failed to insert record");
	}
	return insertedRecord;
}

/**
 * Insert multiple random records into SQLite
 * @param db - Drizzle database instance
 * @param records - Array of random records to insert
 * @returns Promise resolving to array of inserted records
 */
export async function insertRandomRecords(
	db: SqlJsDatabase,
	records: InsertRandom[],
): Promise<SelectRandom[]> {
	if (records.length === 0) {
		return [];
	}

	const result = await db.insert(randoms).values(records).returning();
	return result;
}

/**
 * Get all random records from SQLite
 * @param db - Drizzle database instance
 * @returns Promise resolving to array of all random records
 */
export async function getAllRandomRecords(
	db: SqlJsDatabase,
): Promise<SelectRandom[]> {
	const result = await db.select().from(randoms).orderBy(randoms.created_at);
	return result;
}

/**
 * Get random record by ID
 * @param db - Drizzle database instance
 * @param id - Record ID to find
 * @returns Promise resolving to found record or undefined
 */
export async function getRandomRecordById(
	db: SqlJsDatabase,
	id: string,
): Promise<SelectRandom | undefined> {
	const result = await db
		.select()
		.from(randoms)
		.where(eq(randoms.id, id))
		.limit(1);
	return result[0] || undefined;
}

/**
 * Count total number of random records
 * @param db - Drizzle database instance
 * @returns Promise resolving to total count
 */
export async function countRandomRecords(db: SqlJsDatabase): Promise<number> {
	const result = await db.select({ count: sql`count(*)` }).from(randoms);
	const countResult = result[0];
	if (!countResult) {
		throw new Error("Failed to get count from database");
	}
	return Number(countResult.count);
}

/**
 * Clear all random records from database
 * @param db - Drizzle database instance
 * @returns Promise resolving when operation is complete
 */
export async function clearRandomRecords(db: SqlJsDatabase): Promise<void> {
	await db.delete(randoms);
}
