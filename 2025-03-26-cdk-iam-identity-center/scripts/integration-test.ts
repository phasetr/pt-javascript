#!/usr/bin/env ts-node
/**
 * 簡易結合テストスクリプト
 *
 * このスクリプトは、APIの各エンドポイントに対して簡易的な結合テストを実行します。
 * 環境パラメータ（local, dev, prod）を指定して実行できます。
 * デフォルトはlocalです。
 *
 * 使用方法:
 *   ts-node --esm scripts/integration-test.ts [environment]
 *
 * 例:
 *   ts-node --esm scripts/integration-test.ts local
 *   ts-node --esm scripts/integration-test.ts dev
 *   ts-node --esm scripts/integration-test.ts prod
 */

import fetch from "node-fetch";
import { setTimeout } from "node:timers/promises";

// 環境設定
const environment = process.argv[2] || "local";
console.log(`環境: ${environment}`);

// 環境ごとのベースURL
const getBaseUrl = (env: string): string => {
	switch (env) {
		case "local":
			return "http://localhost:3000";
		case "dev":
			// AWS上の開発環境のAPIエンドポイント
			// 実際のURLに置き換える必要があります
			return (
				process.env.DEV_API_URL ||
				"https://dev-api-url-placeholder.execute-api.ap-northeast-1.amazonaws.com"
			);
		case "prod":
			// AWS上の本番環境のAPIエンドポイント
			// 実際のURLに置き換える必要があります
			return (
				process.env.PROD_API_URL ||
				"https://prod-api-url-placeholder.execute-api.ap-northeast-1.amazonaws.com"
			);
		default:
			throw new Error(`不明な環境: ${env}`);
	}
};

const baseUrl = getBaseUrl(environment);
console.log(`ベースURL: ${baseUrl}`);
console.log(`test: ${process.env.DEV_API_URL}`);

// テスト結果を格納する配列
const testResults: {
	endpoint: string;
	status: "PASS" | "FAIL";
	message?: string;
	data?: unknown;
}[] = [];

// テスト実行関数
const runTest = async () => {
	try {
		console.log(`APIエンドポイント: ${baseUrl}`);
		console.log("テスト実行中...\n");

		// 1. ヘルスチェックエンドポイントのテスト
		await testHealthEndpoint();

		// 2. ルートエンドポイントのテスト
		await testRootEndpoint();

		// 3. アイテム作成エンドポイントのテスト
		const itemId = await testCreateItemEndpoint();

		// 4. アイテム取得エンドポイントのテスト（作成したアイテムを使用）
		if (itemId) {
			await testGetItemEndpoint(itemId);
		}

		// 5. アイテム一覧エンドポイントのテスト
		await testListItemsEndpoint();

		// テスト結果の表示
		displayTestResults();
	} catch (error) {
		console.error("テスト実行中にエラーが発生しました:", error);
		process.exit(1);
	}
};

// ヘルスチェックエンドポイントのテスト
const testHealthEndpoint = async () => {
	try {
		const response = await fetch(`${baseUrl}/health`);
		const data = await response.json();

		if (response.ok && data.status === "ok") {
			testResults.push({
				endpoint: "/health",
				status: "PASS",
				data,
			});
		} else {
			testResults.push({
				endpoint: "/health",
				status: "FAIL",
				message: `ステータスコード: ${response.status}, レスポンス: ${JSON.stringify(data)}`,
			});
		}
	} catch (error) {
		testResults.push({
			endpoint: "/health",
			status: "FAIL",
			message: error instanceof Error ? error.message : String(error),
		});
	}
};

// ルートエンドポイントのテスト
const testRootEndpoint = async () => {
	try {
		const response = await fetch(`${baseUrl}/`);
		const data = await response.json();

		if (response.ok && data.message) {
			testResults.push({
				endpoint: "/",
				status: "PASS",
				data,
			});
		} else {
			testResults.push({
				endpoint: "/",
				status: "FAIL",
				message: `ステータスコード: ${response.status}, レスポンス: ${JSON.stringify(data)}`,
			});
		}
	} catch (error) {
		testResults.push({
			endpoint: "/",
			status: "FAIL",
			message: error instanceof Error ? error.message : String(error),
		});
	}
};

// アイテム作成エンドポイントのテスト
const testCreateItemEndpoint = async (): Promise<string | null> => {
	try {
		const testItem = {
			name: `Test Item ${new Date().toISOString()}`,
			description: "Created during integration test",
		};

		const response = await fetch(`${baseUrl}/items`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(testItem),
		});

		const data = await response.json();

		if (response.ok && data.success && data.id) {
			testResults.push({
				endpoint: "POST /items",
				status: "PASS",
				data,
			});
			return data.id;
		}

		testResults.push({
			endpoint: "POST /items",
			status: "FAIL",
			message: `ステータスコード: ${response.status}, レスポンス: ${JSON.stringify(data)}`,
		});
		return null;
	} catch (error) {
		testResults.push({
			endpoint: "POST /items",
			status: "FAIL",
			message: error instanceof Error ? error.message : String(error),
		});
		return null;
	}
};

// アイテム取得エンドポイントのテスト
const testGetItemEndpoint = async (itemId: string) => {
	try {
		// DynamoDBに書き込みが反映されるまで少し待機
		if (environment !== "local") {
			await setTimeout(1000);
		}

		const response = await fetch(`${baseUrl}/items/${itemId}`);
		const data = await response.json();

		if (response.ok && data.id === itemId) {
			testResults.push({
				endpoint: `GET /items/${itemId}`,
				status: "PASS",
				data,
			});
		} else {
			testResults.push({
				endpoint: `GET /items/${itemId}`,
				status: "FAIL",
				message: `ステータスコード: ${response.status}, レスポンス: ${JSON.stringify(data)}`,
			});
		}
	} catch (error) {
		testResults.push({
			endpoint: `GET /items/${itemId}`,
			status: "FAIL",
			message: error instanceof Error ? error.message : String(error),
		});
	}
};

// アイテム一覧エンドポイントのテスト
const testListItemsEndpoint = async () => {
	try {
		const response = await fetch(`${baseUrl}/items`);
		const data = await response.json();

		if (response.ok && Array.isArray(data.items)) {
			testResults.push({
				endpoint: "GET /items",
				status: "PASS",
				data: { itemCount: data.items.length },
			});
		} else {
			testResults.push({
				endpoint: "GET /items",
				status: "FAIL",
				message: `ステータスコード: ${response.status}, レスポンス: ${JSON.stringify(data)}`,
			});
		}
	} catch (error) {
		testResults.push({
			endpoint: "GET /items",
			status: "FAIL",
			message: error instanceof Error ? error.message : String(error),
		});
	}
};

// テスト結果の表示
const displayTestResults = () => {
	console.log("テスト結果:");
	console.log("=======================\n");

	let passCount = 0;
	let failCount = 0;

	for (const result of testResults) {
		if (result.status === "PASS") {
			console.log(`✅ ${result.endpoint}: 成功`);
			if (result.data) {
				console.log(`   データ: ${JSON.stringify(result.data, null, 2)}`);
			}
			passCount++;
		} else {
			console.log(`❌ ${result.endpoint}: 失敗`);
			if (result.message) {
				console.log(`   エラー: ${result.message}`);
			}
			failCount++;
		}
		console.log("");
	}

	console.log("=======================");
	console.log(`テスト結果: ${passCount}成功, ${failCount}失敗`);

	if (failCount > 0) {
		process.exit(1);
	}
};

// テスト実行
runTest();
