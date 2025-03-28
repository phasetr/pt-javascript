// Environment type
export type Environment = "local" | "dev" | "prod";

// Get current environment from TEST_ENV variable, default to 'local'
export const getEnvironment = (): Environment => {
  // TEST_ENV環境変数から環境を取得
  const testEnv = process.env.TEST_ENV as Environment;
  if (testEnv && ['local', 'dev', 'prod'].includes(testEnv)) {
    return testEnv;
  }
  
  // NODE_ENVから環境を判定
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    // 本番環境の場合はprod
    return 'prod';
  }
  
  if (nodeEnv === 'development') {
    // 開発環境の場合はdev
    return 'dev';
  }
  
  // デフォルトはlocal
  return 'local';
};

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
import { getApiUrlFromCloudFormation } from "./aws-utils.js";
import {
	SecretsManagerClient,
	GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

// Get configuration for current environment
export const getConfig = async (): Promise<ApiConfig> => {
	const env = getEnvironment();

	// 環境に応じた認証情報を取得
	if (env === "local") {
		// ローカル環境の場合は、認証情報を固定値に設定
		config[env].auth.username = "dummy";
		config[env].auth.password = "dummy";
	} else {
		// AWS環境の場合は、Secrets Managerから認証情報を取得
		try {
      const secretName = `CBAL-${env}/BasicAuth`;
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
          const secretString = response.SecretString
            .replace(/([{,])([^,:{}"]+):/g, '$1"$2":') // キーを引用符で囲む
            .replace(/,(?=\s*[},])/g, '') // 余分なカンマを削除
            .replace(/([^\\])\\([^\\"])/g, '$1\\\\$2'); // エスケープされていないバックスラッシュをエスケープ
          
          const secret = JSON.parse(secretString);
          if (secret.username && secret.password) {
            console.log(`Using credentials from Secrets Manager: ${secret.username}:${secret.password}`);
            config[env].auth.username = secret.username;
            config[env].auth.password = secret.password;
          } else {
            console.warn(`Secret does not contain username and password: ${secretString}`);
          }
        } catch (parseError) {
          console.error(`Failed to parse secret: ${response.SecretString}`, parseError);
          // JSONのパースに失敗した場合は、固定値を使用
          config[env].auth.username = "admin";
          config[env].auth.password = "password";
          console.log(`Using hardcoded credentials: ${config[env].auth.username}:${config[env].auth.password}`);
        }
      } else {
        console.warn(`Secret does not contain SecretString: ${secretName}`);
      }
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
	const env = getEnvironment();
	if (env !== "local") {
		config[env].baseUrl = url;
	}
};

// Get API URL for current environment
export const getApiUrl = async (): Promise<string> => {
	const env = getEnvironment();

	// ローカル環境の場合は設定ファイルのURLを使用
	if (env === "local") {
		return config[env].baseUrl;
	}

	// dev/prod環境の場合はAWS SDKを使ってAPIのURLを取得
	try {
		const stackName =
			env === "dev"
				? process.env.DEV_STACK_NAME || "CbalStack-dev"
				: process.env.PROD_STACK_NAME || "CbalStack-prod";

		const apiUrl = await getApiUrlFromCloudFormation(stackName);
		if (apiUrl) {
			// 取得したURLを設定に反映
			config[env].baseUrl = apiUrl;
			return apiUrl;
		}
	} catch (error) {
		console.warn(`Failed to get ${env} API URL from CloudFormation:`, error);
	}

	// CloudFormationからの取得に失敗した場合は設定ファイルのURLを使用
	return config[env].baseUrl;
};
