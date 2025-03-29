import {
	getEnvironment,
	isLocalEnvironment as isLocalEnv,
	getAppConfig as getConfig,
	getAuthCredentials,
	type Environment,
	type AppConfig,
} from "../../../aws-utils/src/index.js";

// Basic認証の認証情報の型
export interface BasicAuthCredentials {
	username: string;
	password: string;
}

// 現在の環境を判定する関数
export function isLocalEnvironment(): boolean {
	// aws-utilsのisLocalEnvironment関数を使用
	return isLocalEnv(process.env.NODE_ENV);
}

// 現在の環境を取得する関数
export function getCurrentEnvironment(): Environment {
	// aws-utilsのgetEnvironment関数を使用
	return getEnvironment(process.env.NODE_ENV);
}

// アプリケーション設定を取得する関数
export async function getAppConfig(): Promise<AppConfig> {
	// aws-utilsのgetAppConfig関数を使用
	return getConfig(process.env.NODE_ENV, process.env.AWS_REGION);
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

	// AWS環境ではaws-utilsのgetAuthCredentials関数を使用
	try {
		const secretName = `CBAL-${environment}/BasicAuth`;
		const credentials = await getAuthCredentials(
			secretName,
			process.env.NODE_ENV,
			process.env.AWS_REGION || "ap-northeast-1"
		);
		
		return credentials;
	} catch (error) {
		console.warn("Failed to get auth credentials from Secrets Manager:", error);
		
		// Secrets Managerからの取得に失敗した場合はデフォルト値を使用
		return {
			username: "admin",
			password: "password",
		};
	}
}
