import { getEnvironment, type Environment } from "aws-utils";

// API configuration for different environments
export interface ApiConfig {
	baseUrl: string;
	auth: {
		username: string;
		password: string;
	};
}

// Configuration for different environments
const config: Record<Environment, ApiConfig> = {
	local: {
		baseUrl: "http://localhost:3000",
		auth: {
			username: "dummy",
			password: "dummy",
		},
	},
	dev: {
		// AWS SDKを使って動的に取得するため、初期値はダミー
		baseUrl: "https://dev-api.example.com", // この値は実際には使用されず、CloudFormationから取得される
		auth: {
			username: "admin",
			password: "password",
		},
	},
	prod: {
		// AWS SDKを使って動的に取得するため、初期値はダミー
		baseUrl: "https://api.example.com", // この値は実際には使用されず、CloudFormationから取得される
		auth: {
			username: "admin",
			password: "password",
		},
	},
};

// AWS SDKを使ってAPIのURLを取得
import { getApiUrlFromCloudFormation, getAuthCredentials, getApiUrl as getAwsApiUrl } from "aws-utils";

// Get configuration for current environment
export const getConfig = async (): Promise<ApiConfig> => {
	const env = getEnvironment(process.env.NODE_ENV);

	// 環境に応じた認証情報を取得
	if (env === "local") {
		// ローカル環境の場合は、認証情報を固定値に設定
		config[env].auth.username = "dummy";
		config[env].auth.password = "dummy";
	} else {
		// AWS環境の場合は、Secrets Managerから認証情報を取得
		try {
			const secretName = `CBAL-${env}/BasicAuth`;
			const credentials = await getAuthCredentials(secretName);
			config[env].auth.username = credentials.username;
			config[env].auth.password = credentials.password;
			console.log(`Using credentials from Secrets Manager: ${credentials.username}:${credentials.password}`);
		} catch (error) {
			console.warn(
				`Failed to get auth credentials from Secrets Manager for ${env} environment:`,
				error,
			);
			// Secrets Managerからの取得に失敗した場合はデフォルト値を使用
		}

		// AWS SDKを使ってAPIのURLを取得
		try {
			const stackName = `CbalStack-${env}`;
			const apiUrl = await getApiUrlFromCloudFormation(stackName);
			if (apiUrl) {
				config[env].baseUrl = apiUrl;
			}
		} catch (error) {
			console.warn(
				`Failed to get API URL from CloudFormation for ${env} environment:`,
				error,
			);
			// CloudFormationからの取得に失敗した場合はデフォルト値を使用
		}
	}

	return config[env];
};

// Update API URL in config
export const updateApiUrl = (url: string): void => {
	const env = getEnvironment(process.env.NODE_ENV);
	if (env !== "local") {
		config[env].baseUrl = url;
	}
};

// Get API URL for current environment
export const getApiUrl = async (): Promise<string> => {
	const env = getEnvironment(process.env.NODE_ENV);
	console.log(`Getting API URL for environment: ${env}`);

	// ローカル環境の場合は設定ファイルのURLを使用
	if (env === "local") {
		return config[env].baseUrl;
	}

	// AWS SDKを使ってAPIのURLを取得
	try {
		const apiUrl = await getAwsApiUrl(config[env].baseUrl);
		if (apiUrl) {
			// 取得したURLを設定に反映
			config[env].baseUrl = apiUrl;
			console.log(`Found API URL: ${apiUrl}`);
			return apiUrl;
		}
	} catch (error) {
		console.warn(`Failed to get API URL:`, error);
	}

	// 取得に失敗した場合は設定ファイルのURLを使用
	console.log(`Using default API URL from config: ${config[env].baseUrl}`);
	return config[env].baseUrl;
};
