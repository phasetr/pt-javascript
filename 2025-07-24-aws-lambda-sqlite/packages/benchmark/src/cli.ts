/**
 * @fileoverview ベンチマークアプリのCLIエントリーポイント
 */
import { resolveLambdaUrl } from "./lambda-url-resolver.js";
import { executeBenchmark, generateReport } from "./benchmark-runner.js";
import type { BenchmarkResult } from "./http-client.js";

/**
 * ベンチマーク実行のパラメータ型
 */
export type BenchmarkOptions = {
	readonly stackName: string;
	readonly iterations: number;
	readonly outputDir: string;
};

/**
 * ベンチマーク実行結果の型
 */
export type BenchmarkRunResult = {
	readonly resultsFile: string;
	readonly totalMeasurements: number;
	readonly summary: readonly BenchmarkResult[];
};

/**
 * ベンチマークを実行する
 * @param options - ベンチマーク実行オプション
 * @returns ベンチマーク実行結果
 */
export async function runBenchmark(options: BenchmarkOptions): Promise<BenchmarkRunResult> {
	// 1. CloudFormation stackからLambda URLを取得
	const lambdaUrl = await resolveLambdaUrl(options.stackName);

	// 2. ベンチマーク実行
	const results = await executeBenchmark(lambdaUrl, options.iterations);

	// 3. レポート生成
	const resultsFile = await generateReport(results, options.outputDir);

	return {
		resultsFile,
		totalMeasurements: results.length,
		summary: results
	};
}