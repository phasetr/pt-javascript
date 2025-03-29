import { getEnvironment } from "./config.js";
import { getApiUrlFromCloudFormation } from "./cloudformation.js";
import { getLambdaUrl } from "./lambda.js";

/**
 * 環境に応じたAPI URLを取得する
 * @param baseUrl ローカル環境用のベースURL（デフォルトは http://localhost:3000）
 * @param nodeEnv 環境変数NODE_ENVの値
 * @param awsRegion AWSリージョン
 * @returns API URL
 */
export async function getApiUrl(
	baseUrl = "http://localhost:3000",
	nodeEnv?: string,
	awsRegion?: string
): Promise<string> {
	const environment = getEnvironment(nodeEnv);

	// ローカル環境の場合は設定ファイルのURLを使用
	if (environment === "local") {
		return baseUrl;
	}

	try {
		// まずCloudFormationスタックからURLを取得を試みる
		try {
			return await getApiUrlFromCloudFormation(undefined, nodeEnv, awsRegion);
		} catch (cfnError) {
			console.warn(
				"Failed to get API URL from CloudFormation, falling back to Lambda function:",
				cfnError,
			);
			// CloudFormationからの取得に失敗した場合はLambda関数からの推測を試みる
			return await getLambdaUrl(undefined, nodeEnv, awsRegion);
		}
	} catch (error) {
		console.error("Error getting API URL:", error);

		// エラーが発生した場合は設定ファイルのデフォルト値を使用
		return baseUrl;
	}
}
