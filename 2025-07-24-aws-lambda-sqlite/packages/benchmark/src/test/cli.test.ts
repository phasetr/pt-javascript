/**
 * @fileoverview CLI tests
 */
import { describe, expect, it, type MockedFunction, vi } from "vitest";

// Mock dependencies
vi.mock("../lambda-url-resolver.js");
vi.mock("../http-client.js");
vi.mock("../benchmark-runner.js");

import { executeBenchmark, generateReport } from "../benchmark-runner.js";
import { runBenchmark } from "../cli.js";
import type { BenchmarkResult } from "../http-client.js";
import { resolveLambdaUrl } from "../lambda-url-resolver.js";

// Typed mocks
const mockResolveLambdaUrl = vi.mocked(resolveLambdaUrl) as MockedFunction<
	typeof resolveLambdaUrl
>;
const mockExecuteBenchmark = vi.mocked(executeBenchmark) as MockedFunction<
	typeof executeBenchmark
>;
const mockGenerateReport = vi.mocked(generateReport) as MockedFunction<
	typeof generateReport
>;

describe("CLI", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should execute benchmark with default parameters", async () => {
		const mockResults: BenchmarkResult[] = [
			{
				endpoint: "sqlite-efs",
				response_time_ms: 64.5,
				status_code: 200,
				success: true,
				measured_at: "2025-07-24T10:30:00.000Z",
			},
		];

		mockResolveLambdaUrl.mockResolvedValue(
			"https://abc123.lambda-url.us-east-1.on.aws/",
		);
		mockExecuteBenchmark.mockResolvedValue(mockResults);
		mockGenerateReport.mockResolvedValue(
			"docs/benchmarks/20250724-103000-benchmark.md",
		);

		const result = await runBenchmark({
			stackName: "test-stack",
			iterations: 100,
			outputDir: "docs/benchmarks",
		});

		expect(result).toEqual({
			resultsFile: "docs/benchmarks/20250724-103000-benchmark.md",
			totalMeasurements: 1,
			summary: mockResults,
		});

		expect(resolveLambdaUrl).toHaveBeenCalledWith("test-stack");
		expect(executeBenchmark).toHaveBeenCalledWith(
			"https://abc123.lambda-url.us-east-1.on.aws/",
			100,
		);
		expect(generateReport).toHaveBeenCalledWith(mockResults, "docs/benchmarks");
	});

	it("should handle custom iterations", async () => {
		const mockResults: BenchmarkResult[] = [];
		mockResolveLambdaUrl.mockResolvedValue(
			"https://xyz789.lambda-url.ap-northeast-1.on.aws/",
		);
		mockExecuteBenchmark.mockResolvedValue(mockResults);
		mockGenerateReport.mockResolvedValue(
			"docs/benchmarks/20250724-103000-benchmark.md",
		);

		const result = await runBenchmark({
			stackName: "prod-stack",
			iterations: 50,
			outputDir: "docs/benchmarks",
		});

		expect(executeBenchmark).toHaveBeenCalledWith(
			"https://xyz789.lambda-url.ap-northeast-1.on.aws/",
			50,
		);
		expect(result.totalMeasurements).toBe(0);
	});

	it("should handle Lambda URL resolution error", async () => {
		mockResolveLambdaUrl.mockRejectedValue(new Error("Stack not found"));

		await expect(
			runBenchmark({
				stackName: "nonexistent-stack",
				iterations: 100,
				outputDir: "docs/benchmarks",
			}),
		).rejects.toThrow("Stack not found");

		expect(resolveLambdaUrl).toHaveBeenCalledWith("nonexistent-stack");
		expect(executeBenchmark).not.toHaveBeenCalled();
	});

	it("should handle benchmark execution error", async () => {
		mockResolveLambdaUrl.mockResolvedValue(
			"https://abc123.lambda-url.us-east-1.on.aws/",
		);
		mockExecuteBenchmark.mockRejectedValue(new Error("Benchmark failed"));

		await expect(
			runBenchmark({
				stackName: "test-stack",
				iterations: 100,
				outputDir: "docs/benchmarks",
			}),
		).rejects.toThrow("Benchmark failed");

		expect(executeBenchmark).toHaveBeenCalledWith(
			"https://abc123.lambda-url.us-east-1.on.aws/",
			100,
		);
		expect(generateReport).not.toHaveBeenCalled();
	});

	it("should handle report generation error", async () => {
		const mockResults: BenchmarkResult[] = [
			{
				endpoint: "ddb",
				response_time_ms: 12.3,
				status_code: 200,
				success: true,
				measured_at: "2025-07-24T10:30:00.000Z",
			},
		];

		mockResolveLambdaUrl.mockResolvedValue(
			"https://abc123.lambda-url.us-east-1.on.aws/",
		);
		mockExecuteBenchmark.mockResolvedValue(mockResults);
		mockGenerateReport.mockRejectedValue(new Error("Report generation failed"));

		await expect(
			runBenchmark({
				stackName: "test-stack",
				iterations: 100,
				outputDir: "docs/benchmarks",
			}),
		).rejects.toThrow("Report generation failed");

		expect(generateReport).toHaveBeenCalledWith(mockResults, "docs/benchmarks");
	});

	it("should use custom stack name and output directory", async () => {
		const mockResults: BenchmarkResult[] = [];
		mockResolveLambdaUrl.mockResolvedValue(
			"https://custom.lambda-url.us-west-2.on.aws/",
		);
		mockExecuteBenchmark.mockResolvedValue(mockResults);
		mockGenerateReport.mockResolvedValue(
			"custom/output/20250724-103000-benchmark.md",
		);

		const result = await runBenchmark({
			stackName: "custom-stack-name",
			iterations: 25,
			outputDir: "custom/output",
		});

		expect(resolveLambdaUrl).toHaveBeenCalledWith("custom-stack-name");
		expect(executeBenchmark).toHaveBeenCalledWith(
			"https://custom.lambda-url.us-west-2.on.aws/",
			25,
		);
		expect(generateReport).toHaveBeenCalledWith(mockResults, "custom/output");
		expect(result.resultsFile).toBe(
			"custom/output/20250724-103000-benchmark.md",
		);
	});
});
