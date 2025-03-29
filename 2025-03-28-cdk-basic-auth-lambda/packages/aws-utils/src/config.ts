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
