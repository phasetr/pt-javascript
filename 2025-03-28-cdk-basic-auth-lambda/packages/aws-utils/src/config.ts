// Environment type
export type Environment = "local" | "dev" | "prod";

/**
 * 環境を取得する関数
 * NODE_ENVの値に基づいて環境を判定する
 * デフォルトはprod
 *
 * @param nodeEnv NODE_ENV環境変数の値
 * @returns 環境タイプ
 */
export const getEnvironment = (nodeEnv?: string): Environment => {
	if (nodeEnv === "local") {
		return "local";
	}
	if (nodeEnv === "development") {
		return "dev";
	}
	return "prod";
};

/**
 * ローカル環境かどうかを判定する関数
 * NODE_ENVが'production'でない場合はローカル環境と判定
 * 
 * @param nodeEnv NODE_ENV環境変数の値
 * @returns ローカル環境かどうか
 */
export const isLocalEnvironment = (nodeEnv?: string): boolean => {
	// NODE_ENVが'production'でない場合はローカル環境と判定
	return nodeEnv !== "production";
};

/**
 * アプリケーション設定の型
 */
export interface AppConfig {
	environment: Environment;
	region: string;
	stage: "local" | "development" | "production";
}

/**
 * アプリケーション設定を取得する関数
 * 環境に応じた設定を返す
 * 
 * @param nodeEnv NODE_ENV環境変数の値
 * @param awsRegion AWSリージョン
 * @returns アプリケーション設定
 */
export const getAppConfig = (
	nodeEnv?: string,
	awsRegion = "ap-northeast-1"
): AppConfig => {
	const environment = getEnvironment(nodeEnv);

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
			region: awsRegion,
			stage: "development",
		};
	}

	return {
		environment: "prod",
		region: awsRegion,
		stage: "production",
	};
};
