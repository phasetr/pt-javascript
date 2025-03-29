import {
	SecretsManagerClient,
	GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { getEnvironment } from "./config.js";

/**
 * Secrets Managerから認証情報を取得する
 * @param secretName シークレット名（デフォルトは環境に応じて自動生成）
 * @param nodeEnv 環境変数NODE_ENVの値
 * @param awsRegion AWSリージョン
 * @returns 認証情報（username, password）
 */
export async function getAuthCredentials(
	secretName?: string,
	nodeEnv?: string,
	awsRegion = "ap-northeast-1",
): Promise<{ username: string; password: string }> {
	// 環境に応じたシークレット名を生成
	const environment = getEnvironment(nodeEnv);
	const defaultSecretName = `CBAL-${environment}/BasicAuth`;

	// 引数でシークレット名が指定されていない場合はデフォルト値を使用
	const secretId = secretName || defaultSecretName;

	// AWS SDKクライアントを初期化
	const client = new SecretsManagerClient({
		region: awsRegion,
	});

	try {
		// シークレットの値を取得
		const command = new GetSecretValueCommand({
			SecretId: secretId,
		});

		const response = await client.send(command);

		if (response.SecretString) {
			try {
				// 正しいJSON形式が前提
				const secret = JSON.parse(response.SecretString);
				if (secret.username && secret.password) {
					return {
						username: secret.username,
						password: secret.password,
					};
				}
				// デフォルト値を返す
				return {
					username: "admin",
					password: "password",
				};
			} catch (parseError) {
				console.error(
					`Failed to parse secret: ${response.SecretString}`,
					parseError,
				);
				// JSONのパースに失敗した場合は、デフォルト値を返す
				return {
					username: "admin",
					password: "password",
				};
			}
		} else {
			// デフォルト値を返す
			return {
				username: "admin",
				password: "password",
			};
		}
	} catch (error) {
		return {
			username: "admin",
			password: "password",
		};
	}
}
