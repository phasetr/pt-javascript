/**
 * @fileoverview Unit tests for SQLite operations (pure functions only)
 */
import { describe, expect, test } from "vitest";
import type { InsertRandom, SelectRandom } from "../sqlite.js";

describe("SQLite type definitions", () => {
	test("should have correct SelectRandom type structure", () => {
		const record: SelectRandom = {
			id: "test123",
			random_value: 0.123456,
			created_at: "2025-07-24T10:30:00.000Z",
		};

		expect(record.id).toBe("test123");
		expect(record.random_value).toBe(0.123456);
		expect(record.created_at).toBe("2025-07-24T10:30:00.000Z");
	});

	test("should have correct InsertRandom type structure", () => {
		const record: InsertRandom = {
			id: "insert123",
			random_value: 0.987654,
			created_at: "2025-07-24T11:00:00.000Z",
		};

		expect(record.id).toBe("insert123");
		expect(record.random_value).toBe(0.987654);
		expect(record.created_at).toBe("2025-07-24T11:00:00.000Z");
	});
});
