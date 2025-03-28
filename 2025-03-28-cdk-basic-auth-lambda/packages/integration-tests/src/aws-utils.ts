import { LambdaClient, GetFunctionCommand } from "@aws-sdk/client-lambda";
import {
	CloudFormationClient,
	DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { getEnvironment } from "./config.js";

/**
 * CloudFormationスタックの出力からAPI GatewayのURLを取得する
 * @param stackName スタック名
 * @returns API GatewayのURL
 */
export async function getApiUrlFromCloudFormation(
	stackName?: string,
): Promise<string> {
	// 環境に応じたスタック名を生成
	const environment = getEnvironment();
	const defaultStackName = `CbalStack-${environment}`;

	// 引数でスタック名が指定されていない場合はデフォルト値を使用
	const cfnStackName = stackName || defaultStackName;

	// AWS SDKクライアントを初期化
	const client = new CloudFormationClient({
		region: process.env.AWS_REGION || "ap-northeast-1",
	});

	try {
		// スタックの情報を取得
		const command = new DescribeStacksCommand({
			StackName: cfnStackName,
		});

		const response = await client.send(command);

		// スタックの出力からAPI GatewayのURLを取得
		const stack = response.Stacks?.[0];
		if (stack?.Outputs) {
			// API Endpointの出力を検索
			// 出力キーは「CBALdevApiEndpoint」のような形式
			const apiEndpointOutput = stack.Outputs.find(
				(output) =>
					output.OutputKey === `CBAL${environment}ApiEndpoint` ||
					output.OutputKey?.includes("ApiEndpoint") ||
					output.Description?.includes("API Gateway endpoint URL"),
			);

			if (apiEndpointOutput?.OutputValue) {
				return apiEndpointOutput.OutputValue;
			}
		}

		// API GatewayのURLが見つからない場合はエラー
		throw new Error(
			`Failed to get API Gateway URL from CloudFormation stack: ${cfnStackName}`,
		);
	} catch (error) {
		console.error("Error getting API Gateway URL from CloudFormation:", error);
		throw error;
	}
}

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

			// Lambda関数からAPI GatewayのURLを推測する
			// 例: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/
			// 実際にはこの推測は難しいため、CloudFormationからの取得を優先する
			
			// dev環境の場合は、既知のURLを使用（一時的な対応）
			if (environment === "dev") {
				const defaultUrl =
					"https://tmpi104l8f.execute-api.ap-northeast-1.amazonaws.com/prod/";
				console.log(`Using default API URL for dev environment: ${defaultUrl}`);
				return defaultUrl;
			}

			// 推測できない場合はエラー
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

/**
 * 環境に応じたAPI URLを取得する
 * @returns API URL
 */
export async function getApiUrl(): Promise<string> {
	const environment = getEnvironment();

	// ローカル環境の場合は設定ファイルのURLを使用
	if (environment === "local") {
		const { getConfig } = await import("./config.js");
		return (await getConfig()).baseUrl;
	}

	try {
		// まずCloudFormationスタックからURLを取得を試みる
		try {
			return await getApiUrlFromCloudFormation();
		} catch (cfnError) {
			console.warn(
				"Failed to get API URL from CloudFormation, falling back to Lambda function:",
				cfnError,
			);
			// CloudFormationからの取得に失敗した場合はLambda関数からの推測を試みる
			return await getLambdaUrl();
		}
	} catch (error) {
		console.error("Error getting API URL:", error);

		// エラーが発生した場合は設定ファイルのデフォルト値を使用
		const { getConfig } = await import("./config.js");
		return (await getConfig()).baseUrl;
	}
}
