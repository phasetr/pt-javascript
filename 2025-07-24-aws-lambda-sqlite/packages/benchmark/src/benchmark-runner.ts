/**
 * @fileoverview ベンチマーク実行とレポート生成
 */

import { promises as fs } from "node:fs";
import { type BenchmarkResult, benchmarkEndpoint } from "./http-client.js";

/**
 * 測定対象のエンドポイント一覧
 */
const ENDPOINTS = ["sqlite-efs", "sqlite-tmp", "ddb"] as const;

/**
 * ベンチマーク統計情報の型
 */
type EndpointStats = {
	readonly avg: number;
	readonly min: number;
	readonly max: number;
	readonly std: number;
	readonly successRate: number;
};

/**
 * 指定されたベースURLに対してすべてのエンドポイントのベンチマークを実行する
 * @param baseUrl - ベースURL
 * @param iterations - 各エンドポイントの実行回数
 * @returns 全ベンチマーク結果
 */
export async function executeBenchmark(
	baseUrl: string,
	iterations: number,
): Promise<BenchmarkResult[]> {
	const results: BenchmarkResult[] = [];

	for (let i = 0; i < iterations; i++) {
		for (const endpoint of ENDPOINTS) {
			const url = `${baseUrl}/${endpoint}`;
			const result = await benchmarkEndpoint(url, endpoint);
			results.push(result);
		}
	}

	return results;
}

/**
 * ベンチマーク結果からCSV形式の文字列を生成する
 * @param results - ベンチマーク結果
 * @returns CSV形式の文字列
 */
export function generateCsvContent(
	results: readonly BenchmarkResult[],
): string {
	const header = "endpoint,response_time_ms,status_code,success,measured_at";

	if (results.length === 0) {
		return header;
	}

	const rows = results.map(
		(result) =>
			`${result.endpoint},${result.response_time_ms},${result.status_code},${result.success},${result.measured_at}`,
	);

	return [header, ...rows].join("\n");
}

/**
 * エンドポイント別の統計を計算する
 * @param results - ベンチマーク結果
 * @param endpoint - エンドポイント名
 * @returns 統計情報
 */
function calculateStats(
	results: readonly BenchmarkResult[],
	endpoint: string,
): EndpointStats {
	const endpointResults = results.filter((r) => r.endpoint === endpoint);

	if (endpointResults.length === 0) {
		return { avg: 0, min: 0, max: 0, std: 0, successRate: 0 };
	}

	const responseTimes = endpointResults.map((r) => r.response_time_ms);
	const successCount = endpointResults.filter((r) => r.success).length;

	const avg =
		responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
	const min = Math.min(...responseTimes);
	const max = Math.max(...responseTimes);

	const variance =
		responseTimes.reduce((sum, time) => sum + (time - avg) ** 2, 0) /
		responseTimes.length;
	const std = Math.sqrt(variance);

	const successRate = (successCount / endpointResults.length) * 100;

	return { avg, min, max, std, successRate };
}

/**
 * ベンチマーク結果からMarkdown形式のレポートを生成する
 * @param results - ベンチマーク結果
 * @returns Markdown形式の文字列
 */
export function generateMarkdownContent(
	results: readonly BenchmarkResult[],
): string {
	const timestamp = new Date().toISOString();
	const totalMeasurements = results.length;
	const iterationsPerEndpoint = totalMeasurements / ENDPOINTS.length;

	const statsTable = ENDPOINTS.map((endpoint) => {
		const stats = calculateStats(results, endpoint);
		return `| ${endpoint} | ${stats.avg.toFixed(2)} | ${stats.min.toFixed(2)} | ${stats.max.toFixed(2)} | ${stats.std.toFixed(2)} | ${stats.successRate.toFixed(1)}% |`;
	}).join("\n");

	return `# AWS Lambda SQLite ベンチマーク結果

## 実行概要
- 測定日時: ${timestamp}
- 総測定回数: ${totalMeasurements}
- エンドポイント別実行回数: ${iterationsPerEndpoint}

## 性能比較

| エンドポイント | 平均(ms) | 最小(ms) | 最大(ms) | 標準偏差 | 成功率 |
|----------------|----------|----------|----------|----------|---------|
${statsTable}

## 分析結果

### パフォーマンス比較
- **sqlite-tmp**: EFS経由のSQLiteをtmpディレクトリにコピーして利用
- **sqlite-efs**: EFS上のSQLiteファイルに直接アクセス  
- **ddb**: DynamoDBを利用

### 推奨事項
レスポンス時間と成功率を総合的に判断して最適な構成を選択してください。

## 生データ
詳細な測定結果は同名のCSVファイルを参照してください。
`;
}

/**
 * ベンチマーク結果からCSVとMarkdownファイルを生成する
 * @param results - ベンチマーク結果
 * @param outputDir - 出力ディレクトリ
 * @returns 生成されたMarkdownファイルのパス
 */
export async function generateReport(
	results: readonly BenchmarkResult[],
	outputDir: string,
): Promise<string> {
	// ファイル名生成（YYYYMMDD-HHMMSS形式）
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	const hour = String(now.getHours()).padStart(2, "0");
	const minute = String(now.getMinutes()).padStart(2, "0");
	const second = String(now.getSeconds()).padStart(2, "0");
	const timestamp = `${year}${month}${day}-${hour}${minute}${second}`;
	const baseFilename = `${timestamp}-benchmark`;

	const csvPath = `${outputDir}/${baseFilename}.csv`;
	const markdownPath = `${outputDir}/${baseFilename}.md`;

	// 出力ディレクトリを作成
	await fs.mkdir(outputDir, { recursive: true });

	// CSV生成・出力
	const csvContent = generateCsvContent(results);
	await fs.writeFile(csvPath, csvContent, "utf-8");

	// Markdown生成・出力
	const markdownContent = generateMarkdownContent(results);
	await fs.writeFile(markdownPath, markdownContent, "utf-8");

	return markdownPath;
}
