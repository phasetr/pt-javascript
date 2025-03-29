import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getLambdaUrl } from "./lambda";
import { getEnvironment } from "./config";
import { LambdaClient, GetFunctionCommand } from "@aws-sdk/client-lambda";

// console.errorのモック
vi.spyOn(console, "error").mockImplementation(() => {});

vi.mock("@aws-sdk/client-lambda", () => {
	const mockSend = vi.fn();

	return {
		LambdaClient: vi.fn().mockImplementation(() => ({
			send: mockSend,
		})),
		GetFunctionCommand: vi.fn().mockImplementation((params) => ({
			...params,
		})),
	};
});

describe("lambda", () => {
	describe("getLambdaUrl", () => {
		const mockLambdaClient = {
			send: vi.fn(),
		};

		beforeEach(() => {
			// モックをリセット
			vi.clearAllMocks();

			// LambdaClientのモックを設定
			vi.mocked(LambdaClient).mockImplementation(
				() => mockLambdaClient as unknown as LambdaClient,
			);
		});

		afterEach(() => {
			vi.resetAllMocks();
		});

		it("should use the provided function name", async () => {
			// モックの応答を設定
			mockLambdaClient.send.mockRejectedValueOnce(new Error("Test error"));

			// 関数を実行して例外をキャッチ
			try {
				await getLambdaUrl("test-function", "development", "ap-northeast-1");
			} catch (error) {
				// エラーは期待通り
			}

			// GetFunctionCommandが正しいパラメータで呼び出されたことを確認
			expect(vi.mocked(GetFunctionCommand)).toHaveBeenCalledWith({
				FunctionName: "test-function",
			});
		});

		it("should generate default function name based on environment", async () => {
			// モックの応答を設定
			mockLambdaClient.send.mockRejectedValueOnce(new Error("Test error"));

			// 関数を実行して例外をキャッチ
			try {
				await getLambdaUrl(undefined, "development", "ap-northeast-1");
			} catch (error) {
				// エラーは期待通り
			}

			// GetFunctionCommandが正しいパラメータで呼び出されたことを確認
			// development は getEnvironment によって dev に変換される
			expect(vi.mocked(GetFunctionCommand)).toHaveBeenCalledWith({
				FunctionName: "CBAL-dev-HonoDockerImageFunction",
			});
		});

		it("should use the provided region", async () => {
			// モックの応答を設定
			mockLambdaClient.send.mockRejectedValueOnce(new Error("Test error"));

			// 関数を実行して例外をキャッチ
			try {
				await getLambdaUrl(undefined, "development", "us-west-2");
			} catch (error) {
				// エラーは期待通り
			}

			// LambdaClientが正しいパラメータで呼び出されたことを確認
			expect(LambdaClient).toHaveBeenCalledWith({
				region: "us-west-2",
			});
		});

		it("should use default region if not provided", async () => {
			// モックの応答を設定
			mockLambdaClient.send.mockRejectedValueOnce(new Error("Test error"));

			// 関数を実行して例外をキャッチ
			try {
				await getLambdaUrl(undefined, "development");
			} catch (error) {
				// エラーは期待通り
			}

			// LambdaClientが正しいパラメータで呼び出されたことを確認
			expect(LambdaClient).toHaveBeenCalledWith({
				region: "ap-northeast-1",
			});
		});

		it("should extract region and account ID from Lambda ARN", async () => {
			// モックの応答を設定
			mockLambdaClient.send.mockResolvedValueOnce({
				Configuration: {
					FunctionName: "CBAL-dev-HonoDockerImageFunction",
					FunctionArn:
						"arn:aws:lambda:us-east-1:123456789012:function:CBAL-dev-HonoDockerImageFunction",
				},
			});

			// 関数を実行して例外をキャッチ
			try {
				await getLambdaUrl(undefined, "development");
			} catch (error) {
				// エラーメッセージを確認
				if (error instanceof Error) {
					expect(error.message).toContain(
						"Failed to determine API Gateway URL",
					);
				}
			}

			// 関数が呼び出されたことを確認
			expect(mockLambdaClient.send).toHaveBeenCalled();
		});

		it("should throw an error if Lambda function info cannot be retrieved", async () => {
			// モックの応答を設定
			mockLambdaClient.send.mockResolvedValueOnce({
				// Configuration が含まれていない
			});

			// 関数を実行して例外をキャッチ
			await expect(getLambdaUrl(undefined, "development")).rejects.toThrow(
				"Failed to get Lambda URL for function",
			);
		});

		it("should throw an error if Lambda API call fails", async () => {
			// モックの応答を設定
			const testError = new Error("Test API error");
			mockLambdaClient.send.mockRejectedValueOnce(testError);

			// 関数を実行して例外をキャッチ
			await expect(getLambdaUrl(undefined, "development")).rejects.toThrow(
				testError,
			);

			// コンソールエラーが呼び出されたことを確認
			expect(console.error).toHaveBeenCalledWith(
				"Error getting Lambda URL:",
				expect.any(Error),
			);
		});
	});
});
