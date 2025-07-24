/**
 * @fileoverview Tests for SQLite operations with Drizzle ORM and sql.js
 */

import { beforeEach, describe, expect, test } from "vitest";
import {
	clearRandomRecords,
	countRandomRecords,
	createSqliteDb,
	getAllRandomRecords,
	getRandomRecordById,
	type InsertRandom,
	insertRandomRecord,
	insertRandomRecords,
	type SqlJsDatabase,
} from "./sqlite-operations.js";

describe("SQLite operations", () => {
	let db: SqlJsDatabase;

	beforeEach(async () => {
		// Create fresh in-memory database for each test
		db = await createSqliteDb();
		// Clear any existing data
		await clearRandomRecords(db);
	});

	describe("createSqliteDb", () => {
		test("should create in-memory database when no path provided", async () => {
			const testDb = await createSqliteDb();
			expect(testDb).toBeDefined();
		});
	});

	describe("insertRandomRecord", () => {
		test("should insert single record and return it", async () => {
			const record: InsertRandom = {
				id: "test123",
				random_value: 0.123456,
				created_at: "2025-07-24T10:30:00.000Z",
			};

			const result = await insertRandomRecord(db, record);

			expect(result).toEqual(record);
			expect(result.id).toBe("test123");
			expect(result.random_value).toBe(0.123456);
			expect(result.created_at).toBe("2025-07-24T10:30:00.000Z");
		});

		test("should handle multiple inserts", async () => {
			const record1: InsertRandom = {
				id: "test1",
				random_value: 0.1,
				created_at: "2025-07-24T10:30:00.000Z",
			};

			const record2: InsertRandom = {
				id: "test2",
				random_value: 0.2,
				created_at: "2025-07-24T10:31:00.000Z",
			};

			await insertRandomRecord(db, record1);
			await insertRandomRecord(db, record2);

			const count = await countRandomRecords(db);
			expect(count).toBe(2);
		});
	});

	describe("insertRandomRecords", () => {
		test("should insert multiple records at once", async () => {
			const records: InsertRandom[] = [
				{
					id: "test1",
					random_value: 0.1,
					created_at: "2025-07-24T10:30:00.000Z",
				},
				{
					id: "test2",
					random_value: 0.2,
					created_at: "2025-07-24T10:31:00.000Z",
				},
				{
					id: "test3",
					random_value: 0.3,
					created_at: "2025-07-24T10:32:00.000Z",
				},
			];

			const result = await insertRandomRecords(db, records);

			expect(result).toHaveLength(3);
			expect(result[0]?.id).toBe("test1");
			expect(result[1]?.id).toBe("test2");
			expect(result[2]?.id).toBe("test3");

			const count = await countRandomRecords(db);
			expect(count).toBe(3);
		});

		test("should handle empty array", async () => {
			const result = await insertRandomRecords(db, []);
			expect(result).toHaveLength(0);

			const count = await countRandomRecords(db);
			expect(count).toBe(0);
		});
	});

	describe("getAllRandomRecords", () => {
		test("should return all records ordered by created_at", async () => {
			const records: InsertRandom[] = [
				{
					id: "test2",
					random_value: 0.2,
					created_at: "2025-07-24T10:31:00.000Z",
				},
				{
					id: "test1",
					random_value: 0.1,
					created_at: "2025-07-24T10:30:00.000Z",
				},
				{
					id: "test3",
					random_value: 0.3,
					created_at: "2025-07-24T10:32:00.000Z",
				},
			];

			await insertRandomRecords(db, records);
			const result = await getAllRandomRecords(db);

			expect(result).toHaveLength(3);
			// Should be ordered by created_at (chronological order)
			expect(result[0]?.id).toBe("test1");
			expect(result[1]?.id).toBe("test2");
			expect(result[2]?.id).toBe("test3");
		});

		test("should return empty array when no records", async () => {
			const result = await getAllRandomRecords(db);
			expect(result).toHaveLength(0);
		});
	});

	describe("getRandomRecordById", () => {
		test("should return record when found", async () => {
			const record: InsertRandom = {
				id: "findme",
				random_value: 0.999,
				created_at: "2025-07-24T10:30:00.000Z",
			};

			await insertRandomRecord(db, record);
			const result = await getRandomRecordById(db, "findme");

			expect(result).toBeDefined();
			expect(result?.id).toBe("findme");
			expect(result?.random_value).toBe(0.999);
		});

		test("should return undefined when not found", async () => {
			const result = await getRandomRecordById(db, "nonexistent");
			expect(result).toBeUndefined();
		});
	});

	describe("countRandomRecords", () => {
		test("should return correct count", async () => {
			expect(await countRandomRecords(db)).toBe(0);

			await insertRandomRecord(db, {
				id: "test1",
				random_value: 0.1,
				created_at: "2025-07-24T10:30:00.000Z",
			});

			expect(await countRandomRecords(db)).toBe(1);

			await insertRandomRecords(db, [
				{
					id: "test2",
					random_value: 0.2,
					created_at: "2025-07-24T10:31:00.000Z",
				},
				{
					id: "test3",
					random_value: 0.3,
					created_at: "2025-07-24T10:32:00.000Z",
				},
			]);

			expect(await countRandomRecords(db)).toBe(3);
		});
	});

	describe("clearRandomRecords", () => {
		test("should remove all records", async () => {
			// Insert some records
			await insertRandomRecords(db, [
				{
					id: "test1",
					random_value: 0.1,
					created_at: "2025-07-24T10:30:00.000Z",
				},
				{
					id: "test2",
					random_value: 0.2,
					created_at: "2025-07-24T10:31:00.000Z",
				},
			]);

			expect(await countRandomRecords(db)).toBe(2);

			// Clear all records
			await clearRandomRecords(db);

			expect(await countRandomRecords(db)).toBe(0);
			const allRecords = await getAllRandomRecords(db);
			expect(allRecords).toHaveLength(0);
		});
	});
});
