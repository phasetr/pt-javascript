/**
 * プロジェクト全体で共通の定数を定義
 */

/**
 * プロジェクトの略称
 */
export const PROJECT_PREFIX = "cwhdt";

/**
 * デフォルトのメールアドレス
 */
export const DEFAULT_EMAIL = "phasetr@gmail.com";

/**
 * デフォルトのリージョン
 */
export const DEFAULT_REGION = "ap-northeast-1";

/**
 * 環境名
 */
export enum Environment {
	DEV = "dev",
	PROD = "prod",
}

/**
 * AWS リソース名
 */
export const AWS_RESOURCE_NAMES = {
	SQS_QUEUE: `${PROJECT_PREFIX}-queue`,
	SES_IDENTITY: `${PROJECT_PREFIX}-email-identity`,
	LAMBDA_FUNCTION: `${PROJECT_PREFIX}-email-sender`,
};
