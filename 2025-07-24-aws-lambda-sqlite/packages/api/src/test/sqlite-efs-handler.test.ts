/**
 * @fileoverview Tests for SQLite EFS direct access handler
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LibSQLDatabase } from "../sqlite.js";
import { handleSqliteEfsRequest } from "../sqlite-efs-handler.js";

// Mock SQLite operations
vi.mock("../sqlite.js", () => ({
	createSqliteDb: vi.fn(),
	getAllRandomRecords: vi.fn(),
}));

describe("handleSqliteEfsRequest", () => {
	let mockDb: LibSQLDatabase;

	beforeEach(() => {
		vi.clearAllMocks();
		mockDb = {} as LibSQLDatabase;
	});

	it("should read data from EFS SQLite file and return response with timing", async () => {
		// Arrange
		const mockRecords = [
			{
				id: "01HZMQ5K9X3A2B7C8D9E0F1G2H",
				random_value: 0.123456789,
				created_at: "2025-07-24T10:30:00Z",
			},
		];

		const { createSqliteDb, getAllRandomRecords } = await import(
			"../sqlite.js"
		);
		vi.mocked(createSqliteDb).mockReturnValue(mockDb);
		vi.mocked(getAllRandomRecords).mockImplementation(async () => {
			// Simulate minimal database operation delay
			await new Promise((resolve) => setTimeout(resolve, 1));
			return mockRecords;
		});

		// Act
		const result = await handleSqliteEfsRequest("/mnt/efs/data.db");

		// Assert
		expect(createSqliteDb).toHaveBeenCalledWith("file:/mnt/efs/data.db");
		expect(getAllRandomRecords).toHaveBeenCalledWith(mockDb);
		expect(result.data).toEqual(mockRecords);
		expect(result.response_time_ms).toBeGreaterThanOrEqual(0);
		expect(typeof result.response_time_ms).toBe("number");
	});

	it("should use default EFS path when no path provided", async () => {
		// Arrange
		const { createSqliteDb, getAllRandomRecords } = await import(
			"../sqlite.js"
		);
		vi.mocked(createSqliteDb).mockReturnValue(mockDb);
		vi.mocked(getAllRandomRecords).mockResolvedValue([]);

		// Act
		await handleSqliteEfsRequest();

		// Assert
		expect(createSqliteDb).toHaveBeenCalledWith("file:/mnt/efs/data.db");
	});

	it("should handle database errors gracefully", async () => {
		// Arrange
		const { createSqliteDb, getAllRandomRecords } = await import(
			"../sqlite.js"
		);
		vi.mocked(createSqliteDb).mockReturnValue(mockDb);
		vi.mocked(getAllRandomRecords).mockRejectedValue(
			new Error("Database connection failed"),
		);

		// Act & Assert
		await expect(handleSqliteEfsRequest()).rejects.toThrow(
			"Database connection failed",
		);
	});

	it("should measure execution time accurately", async () => {
		// Arrange
		const { createSqliteDb, getAllRandomRecords } = await import(
			"../sqlite.js"
		);
		vi.mocked(createSqliteDb).mockReturnValue(mockDb);
		vi.mocked(getAllRandomRecords).mockImplementation(async () => {
			// Simulate database operation delay
			await new Promise((resolve) => setTimeout(resolve, 10));
			return [];
		});

		// Act
		const result = await handleSqliteEfsRequest();

		// Assert
		expect(result.response_time_ms).toBeGreaterThanOrEqual(10);
	});
});
