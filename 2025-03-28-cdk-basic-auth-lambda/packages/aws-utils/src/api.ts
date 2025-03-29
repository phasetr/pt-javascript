import { getEnvironment } from "./config.js";
import { getApiUrlFromCloudFormation } from "./cloudformation.js";
import { getLambdaUrl } from "./lambda.js";

/**
 * 環境に応じたAPI URLを取得する
 * @param baseUrl ローカル環境用のベースURL（デフォルトは http://localhost:3000）
 * @returns API URL
 */
export async function getApiUrl(
	baseUrl = "http://localhost:3000",
): Promise<string> {
	const environment = getEnvironment(process.env.NODE_ENV);

	// ローカル環境の場合は設定ファイルのURLを使用
	if (environment === "local") {
		return baseUrl;
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
		return baseUrl;
	}
}
