import { REALTIME_API_URL } from "./constants";

export function nowJst() {
	const now = new Date();
	return now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

/**
 * Cloudflare Workers環境でOpenAI Realtime APIに接続するためのWebSocketを作成する
 *
 * @param openai_api_key OpenAI APIキー
 * @returns Cloudflare Workers環境でのWebSocket接続
 */
export async function createCloudflareRealtimeApiWebSocket(
	openai_api_key: string,
): Promise<WebSocket> {
	try {
		// OpenAI Realtime APIのURLを準備
		const apiUrl = REALTIME_API_URL.replace("wss://", "https://");
		console.log("👺Connecting to OpenAI Realtime API:", apiUrl);

		// fetch APIを使用してWebSocketアップグレードリクエストを送信
		const response = await fetch(apiUrl, {
			headers: {
				Authorization: `Bearer ${openai_api_key}`,
				"OpenAI-Beta": "realtime=v1",
				Upgrade: "websocket",
				Connection: "Upgrade",
				"Sec-WebSocket-Version": "13",
				"Sec-WebSocket-Key": btoa(Math.random().toString(36).substring(2, 15)),
			},
		});

		// @ts-ignore - Cloudflare Workers固有のAPIのため型エラーを無視
		const webSocket = response.webSocket;

		if (!webSocket) {
			throw new Error(
				"WebSocket接続の確立に失敗しました: response.webSocketがnull",
			);
		}

		// WebSocket接続を確立
		// @ts-ignore - Cloudflare Workers固有のAPIのため型エラーを無視
		webSocket.accept();

		// エラーハンドリングを追加
		webSocket.addEventListener("error", (error: Event) => {
			console.error("👺WebSocket接続エラー:", error);
		});

		console.log("👺OpenAI Realtime API WebSocket connection established");
		return webSocket;
	} catch (error) {
		console.error("👺WebSocket接続エラー:", error);
		throw error;
	}
}

/**
 * ユーザーメッセージを会話アイテムとして作成する
 *
 * @param text ユーザーメッセージ
 * @returns 会話アイテムオブジェクト
 */
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

/**
 * レスポンス作成リクエストを作成する
 *
 * @returns レスポンス作成リクエストオブジェクト
 */
export function createResponse() {
	return {
		type: "response.create",
		response: {
			modalities: ["text"],
			instructions: "Please assist the user.",
		},
	};
}
