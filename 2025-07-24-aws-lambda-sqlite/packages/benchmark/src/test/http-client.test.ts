/**
 * @fileoverview HTTP client tests
 */
import { describe, expect, it, vi } from "vitest";
import { benchmarkEndpoint, type BenchmarkResult } from "../http-client.js";

// Mock fetch globally
global.fetch = vi.fn();

describe("benchmarkEndpoint", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should benchmark endpoint with successful response", async () => {
		const mockResponse = {
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({ result: "success" })
		};
		(global.fetch as any).mockResolvedValue(mockResponse);

		// Set initial time
		vi.setSystemTime(new Date("2025-07-24T10:30:00.000Z"));

		const resultPromise = benchmarkEndpoint("https://example.com/api", "test-endpoint");

		// Advance time by 50ms to simulate response time
		vi.advanceTimersByTime(50);

		const result = await resultPromise;

		expect(result).toEqual({
			endpoint: "test-endpoint",
			response_time_ms: 50,
			status_code: 200,
			success: true,
			measured_at: "2025-07-24T10:30:00.000Z"
		});

		expect(global.fetch).toHaveBeenCalledWith("https://example.com/api");
	});

	it("should handle HTTP error response", async () => {
		const mockResponse = {
			ok: false,
			status: 404,
			json: vi.fn().mockResolvedValue({ error: "Not found" })
		};
		(global.fetch as any).mockResolvedValue(mockResponse);

		vi.setSystemTime(new Date("2025-07-24T10:30:00.000Z"));

		const resultPromise = benchmarkEndpoint("https://example.com/api", "test-endpoint");
		vi.advanceTimersByTime(100);

		const result = await resultPromise;

		expect(result).toEqual({
			endpoint: "test-endpoint",
			response_time_ms: 100,
			status_code: 404,
			success: false,
			measured_at: "2025-07-24T10:30:00.000Z"
		});
	});

	it("should handle network error", async () => {
		(global.fetch as any).mockRejectedValue(new Error("Network error"));

		vi.setSystemTime(new Date("2025-07-24T10:30:00.000Z"));

		const resultPromise = benchmarkEndpoint("https://example.com/api", "test-endpoint");
		vi.advanceTimersByTime(30);

		const result = await resultPromise;

		expect(result).toEqual({
			endpoint: "test-endpoint",
			response_time_ms: 30,
			status_code: 0,
			success: false,
			measured_at: "2025-07-24T10:30:00.000Z"
		});
	});

	it("should handle long response time", async () => {
		const mockResponse = {
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({ result: "success" })
		};
		(global.fetch as any).mockResolvedValue(mockResponse);

		vi.setSystemTime(new Date("2025-07-24T10:30:00.000Z"));

		const resultPromise = benchmarkEndpoint("https://example.com/api", "test-endpoint");
		vi.advanceTimersByTime(2000); // 2 seconds

		const result = await resultPromise;

		expect(result).toEqual({
			endpoint: "test-endpoint",
			response_time_ms: 2000,
			status_code: 200,
			success: true,
			measured_at: "2025-07-24T10:30:00.000Z"
		});
	});

	it("should handle different status codes", async () => {
		const mockResponse = {
			ok: false,
			status: 500,
			json: vi.fn().mockResolvedValue({ error: "Internal server error" })
		};
		(global.fetch as any).mockResolvedValue(mockResponse);

		vi.setSystemTime(new Date("2025-07-24T10:30:00.000Z"));

		const resultPromise = benchmarkEndpoint("https://example.com/api", "test-endpoint");
		vi.advanceTimersByTime(75);

		const result = await resultPromise;

		expect(result).toEqual({
			endpoint: "test-endpoint",
			response_time_ms: 75,
			status_code: 500,
			success: false,
			measured_at: "2025-07-24T10:30:00.000Z"
		});
	});
});