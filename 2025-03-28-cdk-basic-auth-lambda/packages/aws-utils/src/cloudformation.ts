import {
	CloudFormationClient,
	DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { getEnvironment } from "./config.js";

/**
 * CloudFormationスタックの出力からAPI GatewayのURLを取得する
 * @param stackName スタック名
 * @param nodeEnv 環境変数NODE_ENVの値
 * @param awsRegion AWSリージョン
 * @returns API GatewayのURL
 */
export async function getApiUrlFromCloudFormation(
	stackName?: string,
	nodeEnv?: string,
	awsRegion = "ap-northeast-1",
): Promise<string> {
	// 環境に応じたスタック名を生成
	const environment = getEnvironment(nodeEnv);
	const defaultStackName = `CbalStack-${environment}`;

	// 引数でスタック名が指定されていない場合はデフォルト値を使用
	const cfnStackName = stackName || defaultStackName;

	// AWS SDKクライアントを初期化
	const client = new CloudFormationClient({
		region: awsRegion,
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
			// 環境に応じた出力キーを検索
			const apiEndpointOutput = stack.Outputs.find((output) => {
				const isMatch =
					output.OutputKey === `CBAL${environment}ApiEndpoint` ||
					output.OutputKey?.includes("ApiEndpoint") ||
					output.Description?.includes("API Gateway endpoint URL");
				return isMatch;
			});

			if (apiEndpointOutput?.OutputValue) {
				// APIエンドポイントが見つかった場合、環境に応じたパスを追加
				let apiUrl = apiEndpointOutput.OutputValue;
				// URLの末尾が/で終わっていない場合は追加
				if (!apiUrl.endsWith("/")) {
					apiUrl += "/";
				}

				// 環境に応じたパスを追加（例: prod/ -> dev/）
				// 注意: API GatewayのURLは常に/prod/を含む可能性があるため、環境に応じて置換する
				if (environment === "dev") {
					// dev環境の場合、/prod/を/dev/に置換
					apiUrl = apiUrl.replace("/prod/", "/dev/");
					console.log(`Modified API URL for dev environment: ${apiUrl}`);
				} else if (environment === "prod") {
					// prod環境の場合、/dev/を/prod/に置換（念のため）
					if (apiUrl.includes("/dev/")) {
						apiUrl = apiUrl.replace("/dev/", "/prod/");
						console.log(`Modified API URL for prod environment: ${apiUrl}`);
					}
				}
				return apiUrl;
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
 * CloudFormationスタックの情報を取得する
 * @param stackName スタック名
 * @param nodeEnv 環境変数NODE_ENVの値
 * @param awsRegion AWSリージョン
 * @returns スタック情報
 */
export async function getStackInfo(
	stackName?: string,
	nodeEnv?: string,
	awsRegion = "ap-northeast-1",
) {
	// 環境に応じたスタック名を生成
	const environment = getEnvironment(nodeEnv);
	const defaultStackName = `CbalStack-${environment}`;

	// 引数でスタック名が指定されていない場合はデフォルト値を使用
	const cfnStackName = stackName || defaultStackName;

	console.log(`Checking CloudFormation stack: ${cfnStackName}`);

	// AWS SDKクライアントを初期化
	const client = new CloudFormationClient({
		region: awsRegion,
	});

	// スタックの情報を取得
	const command = new DescribeStacksCommand({
		StackName: cfnStackName,
	});

	const response = await client.send(command);

	// スタックの情報を返す
	return response.Stacks?.[0];
}
