import WebSocket from "ws";
import { REALTIME_API_URL } from "./constants";

export function nowJst() {
	const now = new Date();
	return now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export function createRealtimeApiWebSocket(openai_api_key: string) {
	return new WebSocket(REALTIME_API_URL, {
		headers: {
			Authorization: `Bearer ${openai_api_key}`,
			"OpenAI-Beta": "realtime=v1",
		},
	});
}

export function createConversationItem(text: string) {
	return {
		type: "conversation.item.create",
		item: {
			type: "message",
			role: "user",
			content: [
				{
					type: "input_text",
					text,
				},
			],
		},
	};
}

export function createResponse() {
	return {
		type: "response.create",
		response: {
			modalities: ["text"],
			instructions: "Please assist the user.",
		},
	};
}
