/**
 * @fileoverview Hono API tests
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../index.js";

// Mock SQLite handlers
vi.mock("../sqlite-efs-handler.js", () => ({
	handleSqliteEfsRequest: vi.fn(),
}));

vi.mock("../sqlite-tmp-handler.js", () => ({
	handleSqliteTmpRequest: vi.fn(),
}));

describe("API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should handle GET /health", async () => {
		const res = await app.request("/health");

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toEqual({ status: "ok" });
	});

	it("should handle POST /insert", async () => {
		const res = await app.request("/insert", {
			method: "POST",
		});

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("message");
		expect(json).toHaveProperty("response_time_ms");
	});

	it("should handle GET /sqlite-efs successfully", async () => {
		// Arrange
		const mockResponse = {
			data: [
				{
					id: "01HZMQ5K9X3A2B7C8D9E0F1G2H",
					random_value: 0.123456789,
					created_at: "2025-07-24T10:30:00Z",
				},
			],
			response_time_ms: 64.5,
		};

		const { handleSqliteEfsRequest } = await import("../sqlite-efs-handler.js");
		vi.mocked(handleSqliteEfsRequest).mockResolvedValue(mockResponse);

		// Act
		const res = await app.request("/sqlite-efs");

		// Assert
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toEqual(mockResponse);
		expect(handleSqliteEfsRequest).toHaveBeenCalledOnce();
	});

	it("should handle GET /sqlite-efs errors", async () => {
		// Arrange
		const { handleSqliteEfsRequest } = await import("../sqlite-efs-handler.js");
		vi.mocked(handleSqliteEfsRequest).mockRejectedValue(
			new Error("Database connection failed"),
		);

		// Act
		const res = await app.request("/sqlite-efs");

		// Assert
		expect(res.status).toBe(500);
		const json = await res.json();
		expect(json).toEqual({
			error: "Failed to read from EFS SQLite",
			details: "Database connection failed",
		});
	});

	it("should handle GET /sqlite-tmp successfully", async () => {
		// Arrange
		const mockResponse = {
			data: [
				{
					id: "01HZMQ5K9X3A2B7C8D9E0F1G2H",
					random_value: 0.123456789,
					created_at: "2025-07-24T10:30:00Z",
				},
			],
			response_time_ms: 50.2,
			copy_time_ms: 45.0,
			read_time_ms: 5.2,
		};

		const { handleSqliteTmpRequest } = await import("../sqlite-tmp-handler.js");
		vi.mocked(handleSqliteTmpRequest).mockResolvedValue(mockResponse);

		// Act
		const res = await app.request("/sqlite-tmp");

		// Assert
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toEqual(mockResponse);
		expect(handleSqliteTmpRequest).toHaveBeenCalledOnce();
	});

	it("should handle GET /sqlite-tmp errors", async () => {
		// Arrange
		const { handleSqliteTmpRequest } = await import("../sqlite-tmp-handler.js");
		vi.mocked(handleSqliteTmpRequest).mockRejectedValue(
			new Error("Copy failed"),
		);

		// Act
		const res = await app.request("/sqlite-tmp");

		// Assert
		expect(res.status).toBe(500);
		const json = await res.json();
		expect(json).toEqual({
			error: "Failed to copy and read from tmp SQLite",
			details: "Copy failed",
		});
	});

	it("should handle GET /ddb", async () => {
		const res = await app.request("/ddb");

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("data");
		expect(json).toHaveProperty("response_time_ms");
	});
});
