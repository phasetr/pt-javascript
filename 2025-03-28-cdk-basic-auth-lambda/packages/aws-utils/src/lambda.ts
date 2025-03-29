import { LambdaClient, GetFunctionCommand } from "@aws-sdk/client-lambda";
import { getEnvironment } from "./config.js";

/**
 * Lambda関数の情報からAPI GatewayのURLを推測する
 * @param functionName Lambda関数名
 * @returns 推測されたAPI GatewayのURL
 */
export async function getLambdaUrl(functionName?: string): Promise<string> {
	// 環境に応じたLambda関数名を生成
	const environment = getEnvironment();
	const prefix = "CBAL";
	const defaultFunctionName = `${prefix}-${environment}-HonoDockerImageFunction`;

	// 引数で関数名が指定されていない場合はデフォルト値を使用
	const lambdaFunctionName = functionName || defaultFunctionName;

	// AWS SDKクライアントを初期化
	const client = new LambdaClient({
		region: process.env.AWS_REGION || "ap-northeast-1",
	});

	try {
		// Lambda関数の情報を取得
		const command = new GetFunctionCommand({
			FunctionName: lambdaFunctionName,
		});

		const response = await client.send(command);

		// API Gateway URLを取得
		if (response.Configuration?.FunctionArn) {
			// Lambda関数のARNからリージョンとアカウントIDを抽出
			const arnParts = response.Configuration.FunctionArn.split(":");
			const region = arnParts[3];
			const accountId = arnParts[4];

			// Lambda関数からAPI GatewayのURLを推測することは難しいため、
			// CloudFormationからの取得を優先し、それが失敗した場合はエラーとする
			throw new Error(
				`Failed to determine API Gateway URL for Lambda function: ${lambdaFunctionName}`,
			);
		}

		// Lambda関数の情報が取得できない場合はエラー
		throw new Error(
			`Failed to get Lambda URL for function: ${lambdaFunctionName}`,
		);
	} catch (error) {
		console.error("Error getting Lambda URL:", error);
		throw error;
	}
}
