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
