import {
	SecretsManagerClient,
	GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { getEnvironment } from "./config.js";

/**
 * Secrets Managerから認証情報を取得する
 * @param secretName シークレット名（デフォルトは環境に応じて自動生成）
 * @returns 認証情報（username, password）
 */
export async function getAuthCredentials(
	secretName?: string,
): Promise<{ username: string; password: string }> {
	// 環境に応じたシークレット名を生成
	const environment = getEnvironment(process.env.NODE_ENV);
	const defaultSecretName = `CBAL-${environment}/BasicAuth`;

	// 引数でシークレット名が指定されていない場合はデフォルト値を使用
	const secretId = secretName || defaultSecretName;

	// AWS SDKクライアントを初期化
	const client = new SecretsManagerClient({
		region: process.env.AWS_REGION || "ap-northeast-1",
	});

	try {
		// シークレットの値を取得
		const command = new GetSecretValueCommand({
			SecretId: secretId,
		});

		const response = await client.send(command);

		if (response.SecretString) {
			try {
				// JSONの形式が正しくない場合があるため、エラーハンドリングを追加
				const secretString = response.SecretString.replace(
					/([{,])([^,:{}"]+):/g,
					'$1"$2":',
				) // キーを引用符で囲む
					.replace(/,(?=\s*[},])/g, "") // 余分なカンマを削除
					.replace(/([^\\])\\([^\\"])/g, "$1\\\\$2"); // エスケープされていないバックスラッシュをエスケープ

				const secret = JSON.parse(secretString);
				if (secret.username && secret.password) {
					console.log(
						`Using credentials from Secrets Manager: ${secret.username}:${secret.password}`,
					);
					return {
						username: secret.username,
						password: secret.password,
					};
				}
				console.warn(
					`Secret does not contain username and password: ${secretString}`,
				);
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
			console.warn(`Secret does not contain SecretString: ${secretId}`);
			// デフォルト値を返す
			return {
				username: "admin",
				password: "password",
			};
		}
	} catch (error) {
		console.warn(
			`Failed to get auth credentials from Secrets Manager for ${environment} environment:`,
			error,
		);
		// Secrets Managerからの取得に失敗した場合はデフォルト値を返す
		return {
			username: "admin",
			password: "password",
		};
	}
}
