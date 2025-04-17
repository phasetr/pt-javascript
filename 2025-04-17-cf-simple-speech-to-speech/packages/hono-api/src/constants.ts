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

// Constants
export const SYSTEM_MESSAGE =
	"You are a helpful assistant. Respond concisely and clearly.";

// OpenAI Realtime APIのイベントタイプ
export const LOG_EVENT_TYPES = [
	"error",
	"response.content.done",
	"rate_limits.updated",
	"response.done",
	"input_audio_buffer.committed",
	"input_audio_buffer.speech_stopped",
	"input_audio_buffer.speech_started",
	"session.created",
	"session.updated",
];

// OpenAI Realtime APIのURL
export const REALTIME_API_URL =
	"wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";

// テキストのみのセッション更新設定
export const sessionUpdateByString = {
	type: "session.update",
	session: {
		instructions: SYSTEM_MESSAGE,
		modalities: ["text"],
		temperature: 0.8,
	},
};
