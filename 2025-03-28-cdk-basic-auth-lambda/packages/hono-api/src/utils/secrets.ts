import {
	SecretsManagerClient,
	GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import {
	getEnvironment,
	type Environment,
} from "../../../aws-utils/src/index.js";

// アプリケーション設定の型
export interface AppConfig {
	environment: Environment;
	region: string;
	stage: "local" | "development" | "production";
}

// Basic認証の認証情報の型
export interface BasicAuthCredentials {
	username: string;
	password: string;
}

// 現在の環境を判定する関数
export function isLocalEnvironment(): boolean {
	// NODE_ENVが'production'でない場合はローカル環境と判定
	return process.env.NODE_ENV !== "production";
}

// 現在の環境を取得する関数
export function getCurrentEnvironment(): Environment {
	// aws-utilsのgetEnvironment関数を使用
	return getEnvironment(process.env.NODE_ENV);
}

// アプリケーション設定を取得する関数
export async function getAppConfig(): Promise<AppConfig> {
	const environment = getCurrentEnvironment();

	// 環境に応じた設定を返す
	if (environment === "local") {
		return {
			environment: "local",
			region: "ap-northeast-1",
			stage: "local",
		};
	}

	if (environment === "dev") {
		return {
			environment: "dev",
			region: process.env.AWS_REGION || "ap-northeast-1",
			stage: "development",
		};
	}

	return {
		environment: "prod",
		region: process.env.AWS_REGION || "ap-northeast-1",
		stage: "production",
	};
}

// Basic認証の認証情報を取得する関数
export async function getBasicAuthCredentials(): Promise<BasicAuthCredentials> {
	const environment = getCurrentEnvironment();

	// ローカル環境では固定値を返す
	if (environment === "local") {
		return {
			username: "dummy",
			password: "dummy",
		};
	}

	// AWS環境ではSecretsManagerから認証情報を取得
	try {
		const secretName = `CBAL-${environment}/BasicAuth`;
		const client = new SecretsManagerClient({
			region: process.env.AWS_REGION || "ap-northeast-1",
		});

		const command = new GetSecretValueCommand({
			SecretId: secretName,
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
			} catch (parseError) {
				console.error(
					`Failed to parse secret: ${response.SecretString}`,
					parseError,
				);
			}
		}

		console.warn(
			"Failed to get valid credentials from Secrets Manager, using default values",
		);
	} catch (error) {
		console.warn("Failed to get auth credentials from Secrets Manager:", error);
	}

	// Secrets Managerからの取得に失敗した場合はデフォルト値を使用
	return {
		username: "admin",
		password: "password",
	};
}
