// Constants
export const SYSTEM_MESSAGE = "Respond simply.";
export const VOICE = "alloy";

// List of Event Types to log to the console. See the OpenAI Realtime API Documentation: https://platform.openai.com/docs/api-reference/realtime
export const LOG_EVENT_TYPES = [
	"error",
	"response.content.done",
	"rate_limits.updated",
	"response.done",
	"input_audio_buffer.committed",
	"input_audio_buffer.speech_stopped",
	"input_audio_buffer.speech_started",
	"session.created",
];

// Show AI response elapsed timing calculations
export const SHOW_TIMING_MATH = false;

// OpenAI Realtime APIのURL
export const REALTIME_API_URL =
	"wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
