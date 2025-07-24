/**
 * @fileoverview Tests for SQLite tmp copy handler
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LibSQLDatabase } from "../sqlite.js";
import { handleSqliteTmpRequest } from "../sqlite-tmp-handler.js";

// Mock fs promises
vi.mock("node:fs/promises", () => ({
	copyFile: vi.fn(),
	unlink: vi.fn(),
	access: vi.fn(),
}));

// Mock SQLite operations
vi.mock("../sqlite.js", () => ({
	createSqliteDb: vi.fn(),
	getAllRandomRecords: vi.fn(),
}));

describe("handleSqliteTmpRequest", () => {
	let mockDb: LibSQLDatabase;

	beforeEach(() => {
		vi.clearAllMocks();
		mockDb = {} as LibSQLDatabase;
	});

	it("should copy EFS file to tmp, read data, and return response with timing", async () => {
		// Arrange
		const mockRecords = [
			{
				id: "01HZMQ5K9X3A2B7C8D9E0F1G2H",
				random_value: 0.123456789,
				created_at: "2025-07-24T10:30:00Z",
			},
		];

		const fs = await import("node:fs/promises");
		const { createSqliteDb, getAllRandomRecords } = await import(
			"../sqlite.js"
		);

		vi.mocked(fs.copyFile).mockImplementation(async () => {
			// Simulate minimal copy delay
			await new Promise((resolve) => setTimeout(resolve, 1));
		});
		vi.mocked(fs.unlink).mockResolvedValue(undefined);
		vi.mocked(fs.access).mockRejectedValue(new Error("File not found"));
		vi.mocked(createSqliteDb).mockReturnValue(mockDb);
		vi.mocked(getAllRandomRecords).mockImplementation(async () => {
			// Simulate minimal database operation delay
			await new Promise((resolve) => setTimeout(resolve, 1));
			return mockRecords;
		});

		// Act
		const result = await handleSqliteTmpRequest(
			"/mnt/efs/data.db",
			"/tmp/data.db",
		);

		// Assert
		expect(fs.access).toHaveBeenCalledWith("/tmp/data.db");
		expect(fs.unlink).not.toHaveBeenCalled(); // File doesn't exist, so no unlink
		expect(fs.copyFile).toHaveBeenCalledWith(
			"/mnt/efs/data.db",
			"/tmp/data.db",
		);
		expect(createSqliteDb).toHaveBeenCalledWith("file:/tmp/data.db");
		expect(getAllRandomRecords).toHaveBeenCalledWith(mockDb);
		expect(result.data).toEqual(mockRecords);
		expect(result.response_time_ms).toBeGreaterThanOrEqual(0);
		expect(result.copy_time_ms).toBeGreaterThanOrEqual(0);
		expect(result.read_time_ms).toBeGreaterThanOrEqual(0);
		expect(typeof result.response_time_ms).toBe("number");
		expect(typeof result.copy_time_ms).toBe("number");
		expect(typeof result.read_time_ms).toBe("number");
	});

	it("should remove existing tmp file before copying", async () => {
		// Arrange
		const fs = await import("node:fs/promises");
		const { createSqliteDb, getAllRandomRecords } = await import(
			"../sqlite.js"
		);

		vi.mocked(fs.access).mockResolvedValue(undefined); // File exists
		vi.mocked(fs.unlink).mockResolvedValue(undefined);
		vi.mocked(fs.copyFile).mockResolvedValue(undefined);
		vi.mocked(createSqliteDb).mockReturnValue(mockDb);
		vi.mocked(getAllRandomRecords).mockResolvedValue([]);

		// Act
		await handleSqliteTmpRequest("/mnt/efs/data.db", "/tmp/data.db");

		// Assert
		expect(fs.access).toHaveBeenCalledWith("/tmp/data.db");
		expect(fs.unlink).toHaveBeenCalledWith("/tmp/data.db");
		expect(fs.copyFile).toHaveBeenCalledWith(
			"/mnt/efs/data.db",
			"/tmp/data.db",
		);
	});

	it("should use default paths when not provided", async () => {
		// Arrange
		const fs = await import("node:fs/promises");
		const { createSqliteDb, getAllRandomRecords } = await import(
			"../sqlite.js"
		);

		vi.mocked(fs.access).mockRejectedValue(new Error("File not found"));
		vi.mocked(fs.copyFile).mockResolvedValue(undefined);
		vi.mocked(createSqliteDb).mockReturnValue(mockDb);
		vi.mocked(getAllRandomRecords).mockResolvedValue([]);

		// Act
		await handleSqliteTmpRequest();

		// Assert
		expect(fs.access).toHaveBeenCalledWith("/tmp/data.db");
		expect(fs.copyFile).toHaveBeenCalledWith(
			"/mnt/efs/data.db",
			"/tmp/data.db",
		);
		expect(createSqliteDb).toHaveBeenCalledWith("file:/tmp/data.db");
	});

	it("should handle copy errors gracefully", async () => {
		// Arrange
		const fs = await import("node:fs/promises");
		vi.mocked(fs.access).mockRejectedValue(new Error("File not found"));
		vi.mocked(fs.copyFile).mockRejectedValue(new Error("Copy failed"));

		// Act & Assert
		await expect(handleSqliteTmpRequest()).rejects.toThrow("Copy failed");
	});

	it("should handle database errors gracefully", async () => {
		// Arrange
		const fs = await import("node:fs/promises");
		const { createSqliteDb, getAllRandomRecords } = await import(
			"../sqlite.js"
		);

		vi.mocked(fs.access).mockRejectedValue(new Error("File not found"));
		vi.mocked(fs.copyFile).mockResolvedValue(undefined);
		vi.mocked(createSqliteDb).mockReturnValue(mockDb);
		vi.mocked(getAllRandomRecords).mockRejectedValue(
			new Error("Database read failed"),
		);

		// Act & Assert
		await expect(handleSqliteTmpRequest()).rejects.toThrow(
			"Database read failed",
		);
	});

	it("should measure copy and read times separately", async () => {
		// Arrange
		const fs = await import("node:fs/promises");
		const { createSqliteDb, getAllRandomRecords } = await import(
			"../sqlite.js"
		);

		vi.mocked(fs.access).mockRejectedValue(new Error("File not found"));
		vi.mocked(fs.copyFile).mockImplementation(async () => {
			await new Promise((resolve) => setTimeout(resolve, 20));
		});
		vi.mocked(createSqliteDb).mockReturnValue(mockDb);
		vi.mocked(getAllRandomRecords).mockImplementation(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
			return [];
		});

		// Act
		const result = await handleSqliteTmpRequest();

		// Assert
		expect(result.copy_time_ms).toBeGreaterThanOrEqual(20);
		expect(result.read_time_ms).toBeGreaterThanOrEqual(10);
		expect(result.response_time_ms).toBeGreaterThanOrEqual(
			result.copy_time_ms + result.read_time_ms,
		);
	});
});
