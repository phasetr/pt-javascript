/**
 * @fileoverview Benchmark runner tests
 */

import { promises as fs } from "node:fs";
import { ulid } from "ulid";
import { describe, expect, it, type MockedFunction, vi } from "vitest";
import {
	executeBenchmark,
	generateCsvContent,
	generateMarkdownContent,
	generateReport,
} from "../benchmark-runner.js";
import { type BenchmarkResult, benchmarkEndpoint } from "../http-client.js";

// Mock dependencies
vi.mock("../http-client.js");
vi.mock("ulid");
vi.mock("node:fs");

// Typed mocks
const mockBenchmarkEndpoint = vi.mocked(benchmarkEndpoint) as MockedFunction<
	typeof benchmarkEndpoint
>;
const mockUlid = vi.mocked(ulid) as MockedFunction<typeof ulid>;
const mockFs = vi.mocked(fs);

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
				measured_at: "2025-07-24T10:30:00.000Z",
			},
			{
				endpoint: "sqlite-tmp",
				response_time_ms: 5.2,
				status_code: 200,
				success: true,
				measured_at: "2025-07-24T10:30:01.000Z",
			},
			{
				endpoint: "ddb",
				response_time_ms: 12.3,
				status_code: 200,
				success: true,
				measured_at: "2025-07-24T10:30:02.000Z",
			},
		];

		const [result0, result1, result2] = mockResults as [
			BenchmarkResult,
			BenchmarkResult,
			BenchmarkResult,
		];
		mockBenchmarkEndpoint
			.mockResolvedValueOnce(result0)
			.mockResolvedValueOnce(result1)
			.mockResolvedValueOnce(result2);

		const results = await executeBenchmark("https://api.example.com", 1);

		expect(results).toEqual(mockResults);
		expect(benchmarkEndpoint).toHaveBeenCalledTimes(3);
		expect(benchmarkEndpoint).toHaveBeenCalledWith(
			"https://api.example.com/sqlite-efs",
			"sqlite-efs",
		);
		expect(benchmarkEndpoint).toHaveBeenCalledWith(
			"https://api.example.com/sqlite-tmp",
			"sqlite-tmp",
		);
		expect(benchmarkEndpoint).toHaveBeenCalledWith(
			"https://api.example.com/ddb",
			"ddb",
		);
	});

	it("should execute benchmark multiple iterations", async () => {
		const mockResult = {
			endpoint: "ddb",
			response_time_ms: 12.3,
			status_code: 200,
			success: true,
			measured_at: "2025-07-24T10:30:00.000Z",
		};

		mockBenchmarkEndpoint.mockResolvedValue(mockResult);

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
			measured_at: "2025-07-24T10:30:00.000Z",
		};

		const errorResult = {
			endpoint: "sqlite-efs",
			response_time_ms: 100,
			status_code: 500,
			success: false,
			measured_at: "2025-07-24T10:30:01.000Z",
		};

		mockBenchmarkEndpoint
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
				measured_at: "2025-07-24T10:30:00.000Z",
			},
			{
				endpoint: "sqlite-tmp",
				response_time_ms: 5.2,
				status_code: 200,
				success: true,
				measured_at: "2025-07-24T10:30:01.000Z",
			},
		];

		const csvContent = generateCsvContent(results);

		expect(csvContent).toBe(
			"endpoint,response_time_ms,status_code,success,measured_at\n" +
				"sqlite-efs,64.5,200,true,2025-07-24T10:30:00.000Z\n" +
				"sqlite-tmp,5.2,200,true,2025-07-24T10:30:01.000Z",
		);
	});

	it("should handle empty results", () => {
		const csvContent = generateCsvContent([]);
		expect(csvContent).toBe(
			"endpoint,response_time_ms,status_code,success,measured_at",
		);
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
				measured_at: "2025-07-24T10:30:00.000Z",
			},
			{
				endpoint: "sqlite-efs",
				response_time_ms: 89.3,
				status_code: 200,
				success: true,
				measured_at: "2025-07-24T10:30:01.000Z",
			},
			{
				endpoint: "sqlite-tmp",
				response_time_ms: 5.2,
				status_code: 200,
				success: true,
				measured_at: "2025-07-24T10:30:02.000Z",
			},
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
				measured_at: "2025-07-24T10:30:00.000Z",
			},
			{
				endpoint: "sqlite-efs",
				response_time_ms: 100,
				status_code: 500,
				success: false,
				measured_at: "2025-07-24T10:30:01.000Z",
			},
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
				measured_at: "2025-07-24T10:30:00.000Z",
			},
		];

		mockUlid.mockReturnValue("01ARZ3NDEKTSV4RRFFQ69G5FAV");
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2025-07-24T10:30:00.000Z"));

		mockFs.mkdir.mockResolvedValue(undefined);
		mockFs.writeFile.mockResolvedValue(undefined);

		const markdownFile = await generateReport(results, "docs/benchmarks");

		expect(markdownFile).toMatch(
			/^docs\/benchmarks\/\d{8}-\d{6}-benchmark\.md$/,
		);

		expect(fs.mkdir).toHaveBeenCalledWith("docs/benchmarks", {
			recursive: true,
		});
		expect(fs.writeFile).toHaveBeenCalledTimes(2);

		// Check CSV file creation
		const csvCall = mockFs.writeFile.mock.calls.find(
			(call: unknown[]) =>
				typeof call[0] === "string" && call[0].endsWith(".csv"),
		);
		expect(csvCall).toBeDefined();
		expect(csvCall?.[0]).toMatch(
			/^docs\/benchmarks\/\d{8}-\d{6}-benchmark\.csv$/,
		);

		// Check Markdown file creation
		const mdCall = mockFs.writeFile.mock.calls.find(
			(call: unknown[]) =>
				typeof call[0] === "string" && call[0].endsWith(".md"),
		);
		expect(mdCall).toBeDefined();
		expect(mdCall?.[0]).toMatch(
			/^docs\/benchmarks\/\d{8}-\d{6}-benchmark\.md$/,
		);
	});

	it("should handle file system errors", async () => {
		const results = [
			{
				endpoint: "ddb",
				response_time_ms: 12.3,
				status_code: 200,
				success: true,
				measured_at: "2025-07-24T10:30:00.000Z",
			},
		];

		mockUlid.mockReturnValue("01ARZ3NDEKTSV4RRFFQ69G5FAV");
		mockFs.mkdir.mockRejectedValue(new Error("Permission denied"));

		await expect(generateReport(results, "docs/benchmarks")).rejects.toThrow(
			"Permission denied",
		);
	});

	afterEach(() => {
		vi.useRealTimers();
	});
});
