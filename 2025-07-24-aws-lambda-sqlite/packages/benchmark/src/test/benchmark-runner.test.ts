/**
 * @fileoverview Benchmark runner tests
 */
import { describe, expect, it, vi } from "vitest";
import { executeBenchmark, generateReport, generateCsvContent, generateMarkdownContent } from "../benchmark-runner.js";
import { benchmarkEndpoint } from "../http-client.js";
import { ulid } from "ulid";
import { promises as fs } from "node:fs";

// Mock dependencies
vi.mock("../http-client.js");
vi.mock("ulid");
vi.mock("node:fs");

describe("executeBenchmark", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should execute benchmark for all endpoints", async () => {
		const mockResults = [
			{
				endpoint: "sqlite-efs",
				response_time_ms: 64.5,
				status_code: 200,
				success: true,
				measured_at: "2025-07-24T10:30:00.000Z"
			},
			{
				endpoint: "sqlite-tmp",
				response_time_ms: 5.2,
				status_code: 200,
				success: true,
				measured_at: "2025-07-24T10:30:01.000Z"
			},
			{
				endpoint: "ddb",
				response_time_ms: 12.3,
				status_code: 200,
				success: true,
				measured_at: "2025-07-24T10:30:02.000Z"
			}
		];

		(benchmarkEndpoint as any)
			.mockResolvedValueOnce(mockResults[0])
			.mockResolvedValueOnce(mockResults[1])
			.mockResolvedValueOnce(mockResults[2]);

		const results = await executeBenchmark("https://api.example.com", 1);

		expect(results).toEqual(mockResults);
		expect(benchmarkEndpoint).toHaveBeenCalledTimes(3);
		expect(benchmarkEndpoint).toHaveBeenCalledWith("https://api.example.com/sqlite-efs", "sqlite-efs");
		expect(benchmarkEndpoint).toHaveBeenCalledWith("https://api.example.com/sqlite-tmp", "sqlite-tmp");
		expect(benchmarkEndpoint).toHaveBeenCalledWith("https://api.example.com/ddb", "ddb");
	});

	it("should execute benchmark multiple iterations", async () => {
		const mockResult = {
			endpoint: "ddb",
			response_time_ms: 12.3,
			status_code: 200,
			success: true,
			measured_at: "2025-07-24T10:30:00.000Z"
		};

		(benchmarkEndpoint as any).mockResolvedValue(mockResult);

		const results = await executeBenchmark("https://api.example.com", 2);

		expect(results).toHaveLength(6); // 3 endpoints × 2 iterations
		expect(benchmarkEndpoint).toHaveBeenCalledTimes(6);
	});

	it("should handle endpoint errors gracefully", async () => {
		const successResult = {
			endpoint: "ddb",
			response_time_ms: 12.3,
			status_code: 200,
			success: true,
			measured_at: "2025-07-24T10:30:00.000Z"
		};

		const errorResult = {
			endpoint: "sqlite-efs",
			response_time_ms: 100,
			status_code: 500,
			success: false,
			measured_at: "2025-07-24T10:30:01.000Z"
		};

		(benchmarkEndpoint as any)
			.mockResolvedValueOnce(errorResult)
			.mockResolvedValueOnce(successResult)
			.mockResolvedValueOnce(successResult);

		const results = await executeBenchmark("https://api.example.com", 1);

		expect(results).toHaveLength(3);
		expect(results[0]).toEqual(errorResult);
		expect(results[1]).toEqual(successResult);
		expect(results[2]).toEqual(successResult);
	});
});

describe("generateCsvContent", () => {
	it("should generate CSV content from benchmark results", () => {
		const results = [
			{
				endpoint: "sqlite-efs",
				response_time_ms: 64.5,
				status_code: 200,
				success: true,
				measured_at: "2025-07-24T10:30:00.000Z"
			},
			{
				endpoint: "sqlite-tmp",
				response_time_ms: 5.2,
				status_code: 200,
				success: true,
				measured_at: "2025-07-24T10:30:01.000Z"
			}
		];

		const csvContent = generateCsvContent(results);

		expect(csvContent).toBe(
			"endpoint,response_time_ms,status_code,success,measured_at\n" +
			"sqlite-efs,64.5,200,true,2025-07-24T10:30:00.000Z\n" +
			"sqlite-tmp,5.2,200,true,2025-07-24T10:30:01.000Z"
		);
	});

	it("should handle empty results", () => {
		const csvContent = generateCsvContent([]);
		expect(csvContent).toBe("endpoint,response_time_ms,status_code,success,measured_at");
	});
});

describe("generateMarkdownContent", () => {
	it("should generate markdown report from benchmark results", () => {
		const results = [
			{
				endpoint: "sqlite-efs",
				response_time_ms: 64.5,
				status_code: 200,
				success: true,
				measured_at: "2025-07-24T10:30:00.000Z"
			},
			{
				endpoint: "sqlite-efs",
				response_time_ms: 89.3,
				status_code: 200,
				success: true,
				measured_at: "2025-07-24T10:30:01.000Z"
			},
			{
				endpoint: "sqlite-tmp",
				response_time_ms: 5.2,
				status_code: 200,
				success: true,
				measured_at: "2025-07-24T10:30:02.000Z"
			}
		];

		const markdownContent = generateMarkdownContent(results);

		expect(markdownContent).toContain("# AWS Lambda SQLite ベンチマーク結果");
		expect(markdownContent).toContain("| sqlite-efs | ");
		expect(markdownContent).toContain("| sqlite-tmp | ");
		expect(markdownContent).toContain("76.90"); // Average of 64.5 and 89.3
		expect(markdownContent).toContain("5.20"); // Average of single value
	});

	it("should handle results with failures", () => {
		const results = [
			{
				endpoint: "sqlite-efs",
				response_time_ms: 64.5,
				status_code: 200,
				success: true,
				measured_at: "2025-07-24T10:30:00.000Z"
			},
			{
				endpoint: "sqlite-efs",
				response_time_ms: 100,
				status_code: 500,
				success: false,
				measured_at: "2025-07-24T10:30:01.000Z"
			}
		];

		const markdownContent = generateMarkdownContent(results);

		expect(markdownContent).toContain("50.0%");
	});
});

describe("generateReport", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should generate CSV and Markdown files", async () => {
		const results = [
			{
				endpoint: "ddb",
				response_time_ms: 12.3,
				status_code: 200,
				success: true,
				measured_at: "2025-07-24T10:30:00.000Z"
			}
		];

		(ulid as any).mockReturnValue("01ARZ3NDEKTSV4RRFFQ69G5FAV");
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2025-07-24T10:30:00.000Z"));

		(fs.mkdir as any).mockResolvedValue(undefined);
		(fs.writeFile as any).mockResolvedValue(undefined);

		const markdownFile = await generateReport(results, "docs/benchmarks");

		expect(markdownFile).toMatch(/^docs\/benchmarks\/\d{8}-\d{6}-benchmark\.md$/);

		expect(fs.mkdir).toHaveBeenCalledWith("docs/benchmarks", { recursive: true });
		expect(fs.writeFile).toHaveBeenCalledTimes(2);

		// Check CSV file creation
		const csvCall = (fs.writeFile as any).mock.calls.find((call: any[]) =>
			call[0].endsWith(".csv")
		);
		expect(csvCall).toBeDefined();
		expect(csvCall[0]).toMatch(/^docs\/benchmarks\/\d{8}-\d{6}-benchmark\.csv$/);

		// Check Markdown file creation
		const mdCall = (fs.writeFile as any).mock.calls.find((call: any[]) =>
			call[0].endsWith(".md")
		);
		expect(mdCall).toBeDefined();
		expect(mdCall[0]).toMatch(/^docs\/benchmarks\/\d{8}-\d{6}-benchmark\.md$/);
	});

	it("should handle file system errors", async () => {
		const results = [
			{
				endpoint: "ddb",
				response_time_ms: 12.3,
				status_code: 200,
				success: true,
				measured_at: "2025-07-24T10:30:00.000Z"
			}
		];

		(ulid as any).mockReturnValue("01ARZ3NDEKTSV4RRFFQ69G5FAV");
		(fs.mkdir as any).mockRejectedValue(new Error("Permission denied"));

		await expect(generateReport(results, "docs/benchmarks")).rejects.toThrow("Permission denied");
	});

	afterEach(() => {
		vi.useRealTimers();
	});
});