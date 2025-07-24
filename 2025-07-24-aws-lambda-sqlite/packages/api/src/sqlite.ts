/**
 * @fileoverview SQLite operations using Drizzle ORM with libSQL
 */
import { createClient } from "@libsql/client";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import {
	type InsertRandom,
	randoms,
	type SelectRandom,
} from "./sqlite-schema.js";

export type LibSQLDatabase = ReturnType<typeof drizzle<Record<string, never>>>;
export type { SelectRandom, InsertRandom };

/**
 * Create SQLite database connection with libSQL and Drizzle ORM
 * @param dbPath - Optional path to existing database file (file: or memory:)
 * @returns Drizzle database instance with libSQL
 */
export function createSqliteDb(dbPath?: string): LibSQLDatabase {
	const url = dbPath || "file:memory:";

	const client = createClient({
		url,
	});

	const db = drizzle(client);

	// Create tables if they don't exist (will be handled by migrations in real deployment)
	createTables(client);

	return db;
}

/**
 * Create SQLite tables using raw SQL via libSQL client
 * @param client - libSQL client instance
 */
function createTables(client: ReturnType<typeof createClient>): void {
	client.execute(`
		CREATE TABLE IF NOT EXISTS randoms (
			id TEXT PRIMARY KEY,
			random_value REAL NOT NULL,
			created_at TEXT NOT NULL
		)
	`);
}

/**
 * Insert a single random record into SQLite
 * @param db - Drizzle database instance
 * @param record - Random record to insert
 * @returns Promise resolving to inserted record
 */
export async function insertRandomRecord(
	db: LibSQLDatabase,
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
	db: LibSQLDatabase,
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
	db: LibSQLDatabase,
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
	db: LibSQLDatabase,
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
export async function countRandomRecords(db: LibSQLDatabase): Promise<number> {
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
export async function clearRandomRecords(db: LibSQLDatabase): Promise<void> {
	await db.delete(randoms);
}
