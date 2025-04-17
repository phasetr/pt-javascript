/**
 * WebSocket Voice ハンドラー共通ロジック
 *
 * Cloudflare WorkersとNode.js環境で共通して使用される
 * OpenAI Realtime APIを使用した音声対話サーバーのコア機能
 */

// 共通の定数
export const SYSTEM_MESSAGE = "Respond simply.";
export const VOICE = "alloy";

/**
 * セッション初期化用のメッセージを作成
 */
export const createSessionUpdateMessage = () => {
	return {
		type: "session.update",
		session: {
			turn_detection: { type: "server_vad" },
			input_audio_format: "g711_ulaw",
			output_audio_format: "g711_ulaw",
			voice: VOICE,
			instructions: SYSTEM_MESSAGE,
			modalities: ["text", "audio"],
			temperature: 0.8,
		},
	};
};

/**
 * WebSocketの共通インターフェース
 * CloudflareとNode.jsの両方の環境で動作するように
 */
export interface WebSocketLike {
	send(data: string): void;
	readyState?: number;
}

/**
 * 音声入力が開始された時の処理
 * AIの応答を途中で切り上げる
 */
export const handleSpeechStartedEvent = (
	markQueue: string[],
	responseStartTimestampTwilio: number | null,
	latestMediaTimestamp: number,
	lastAssistantItem: string | null,
	openAiWs: WebSocketLike,
	serverWs: WebSocketLike,
	streamSid: string | null,
) => {
	if (markQueue.length > 0 && responseStartTimestampTwilio != null) {
		const elapsedTime = latestMediaTimestamp - responseStartTimestampTwilio;

		if (lastAssistantItem) {
			const truncateEvent = {
				type: "conversation.item.truncate",
				item_id: lastAssistantItem,
				content_index: 0,
				audio_end_ms: elapsedTime,
			};
			openAiWs.send(JSON.stringify(truncateEvent));
		}

		serverWs.send(
			JSON.stringify({
				event: "clear",
				streamSid: streamSid,
			}),
		);

		return {
			markQueue: [],
			lastAssistantItem: null,
			responseStartTimestampTwilio: null,
		};
	}

	return { markQueue, lastAssistantItem, responseStartTimestampTwilio };
};

/**
 * マークメッセージを送信
 * AIの応答再生が完了したかどうかを確認するため
 */
export const sendMark = (
	connection: WebSocketLike,
	streamSid: string | null,
	markQueue: string[],
) => {
	if (streamSid) {
		const markEvent = {
			event: "mark",
			streamSid: streamSid,
			mark: { name: "responsePart" },
		};
		connection.send(JSON.stringify(markEvent));
		markQueue.push("responsePart");
	}
	return markQueue;
};

/**
 * OpenAIからの音声データを処理
 */
export const handleAudioDelta = (
	response: {
		delta: string;
		item_id?: string;
	},
	streamSid: string | null,
	serverWs: WebSocketLike,
	responseStartTimestampTwilio: number | null,
	latestMediaTimestamp: number,
	lastAssistantItem: string | null,
	markQueue: string[],
) => {
	const audioDelta = {
		event: "media",
		streamSid: streamSid,
		media: { payload: response.delta },
	};
	serverWs.send(JSON.stringify(audioDelta));

	// First delta from a new response starts the elapsed time counter
	let newResponseStartTimestampTwilio = responseStartTimestampTwilio;
	if (!responseStartTimestampTwilio) {
		newResponseStartTimestampTwilio = latestMediaTimestamp;
	}

	let newLastAssistantItem = lastAssistantItem;
	if (response.item_id) {
		newLastAssistantItem = response.item_id;
	}

	const newMarkQueue = sendMark(serverWs, streamSid, [...markQueue]);

	return {
		responseStartTimestampTwilio: newResponseStartTimestampTwilio,
		lastAssistantItem: newLastAssistantItem,
		markQueue: newMarkQueue,
	};
};

/**
 * Twilioからのメディアメッセージを処理
 */
export const handleMediaMessage = (
	data: {
		media: {
			payload: string;
			timestamp?: number;
		};
	},
	openAiWs: WebSocketLike,
) => {
	const audioAppend = {
		type: "input_audio_buffer.append",
		audio: data.media.payload,
	};
	openAiWs.send(JSON.stringify(audioAppend));
};

/**
 * 会話開始メッセージを作成
 */
export const createConversationItem = () => {
	return {
		type: "conversation.item.create",
		item: {
			type: "message",
			role: "user",
			content: [],
		},
	};
};

/**
 * レスポンス作成リクエストを作成
 */
export const createResponseItem = () => {
	return {
		type: "response.create",
		response: {
			modalities: ["text", "audio"],
			instructions: SYSTEM_MESSAGE,
		},
	};
};
