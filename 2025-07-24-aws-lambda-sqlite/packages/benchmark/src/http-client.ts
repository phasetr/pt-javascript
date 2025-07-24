/**
 * @fileoverview Lambda エンドポイントへのHTTPリクエスト実行とベンチマーク測定
 */

/**
 * ベンチマーク結果の型定義
 */
export type BenchmarkResult = {
	readonly endpoint: string;
	readonly response_time_ms: number;
	readonly status_code: number;
	readonly success: boolean;
	readonly measured_at: string;
};

/**
 * 指定されたエンドポイントに対してHTTPリクエストを実行し、レスポンス時間を測定する
 * @param url - リクエスト先URL
 * @param endpointName - エンドポイント識別名
 * @returns ベンチマーク結果
 */
export async function benchmarkEndpoint(url: string, endpointName: string): Promise<BenchmarkResult> {
	const startTime = Date.now();
	const measuredAt = new Date().toISOString();

	try {
		const response = await fetch(url);
		const endTime = Date.now();
		const responseTimeMs = endTime - startTime;

		// レスポンスボディを消費（メモリリーク防止）
		await response.json().catch(() => {
			// JSON parse errorは無視（レスポンス測定が目的）
		});

		return {
			endpoint: endpointName,
			response_time_ms: responseTimeMs,
			status_code: response.status,
			success: response.ok,
			measured_at: measuredAt
		};
	} catch (error) {
		const endTime = Date.now();
		const responseTimeMs = endTime - startTime;

		return {
			endpoint: endpointName,
			response_time_ms: responseTimeMs,
			status_code: 0, // Network error
			success: false,
			measured_at: measuredAt
		};
	}
}