/**
 * Cloudflare環境用のWebSocket Voice ハンドラー
 *
 * このファイルはCloudflare環境でOpenAI Realtime APIを使用した音声対話サーバーを提供します。
 */

import type { Context } from "hono";
import type { Env } from "hono/types";
import { createCloudflareRealtimeApiWebSocket } from "../../utils";
import { logMessage } from "../../utils/logger";
import {
	createConversationItem,
	createResponseItem,
	createSessionUpdateMessage,
	handleAudioDelta,
	handleMediaMessage,
	handleSpeechStartedEvent,
} from "./ws-voice-common";

// 環境変数の型拡張
type EnvWithOpenAI = Env & {
	OPENAI_API_KEY?: string;
	ENVIRONMENT?: string;
};

/**
 * Cloudflare環境用のWebSocketサーバーを設定するための関数
 * OpenAI Realtime APIを使用した音声対話を処理します
 */
export const wsVoiceHandler = async (
	c: Context<{ Bindings: EnvWithOpenAI }>,
) => {
	// 環境変数の判定（ローカル環境かどうか）
	// 標準ではfalse、環境変数があり、かつ値がLOCALである場合にのみtrue
	const isLocalEnvironment: boolean = Boolean(
		c.env.ENVIRONMENT && c.env.ENVIRONMENT === "LOCAL",
	);

	// Node.js版は別処理
	// WebSocketサーバーを作成
	const webSocketPair = new WebSocketPair();
	// Cloudflareのエッジとクライアント（Twilio）間のWebSocket接続
	const client = webSocketPair[0];
	// Workerスクリプト内で操作するWebSocket接続
	const server = webSocketPair[1];

	try {
		// Node.js版にはない
		// WebSocketの接続をアップグレード
		const upgradeHeader = c.req.header("Upgrade");
		if (!upgradeHeader || upgradeHeader !== "websocket") {
			return c.text("Expected Upgrade: websocket", 400);
		}

		// Connection-specific state
		let streamSid: string | null = null;
		let latestMediaTimestamp = 0;
		let lastAssistantItem: string | null = null;
		let markQueue: string[] = [];
		let responseStartTimestampTwilio: number | null = null;

		// 環境変数から OPENAI_API_KEY を取得
		const OPENAI_API_KEY = c.env.OPENAI_API_KEY;
		if (!OPENAI_API_KEY) {
			console.error("OpenAI API Key is not set");
			return c.text("OpenAI API Key is not set", 500);
		}

		// Node.js版にはない
		// OpenAIサーバーとの接続状態管理
		let openAiConnected = false;
		let conversationStarted = false;

		// OpenAIとのWebSocket接続を作成
		const openAiWs = await createCloudflareRealtimeApiWebSocket(OPENAI_API_KEY);

		// セッション初期化
		const initializeSession = () => {
			const sessionUpdate = createSessionUpdateMessage();
			openAiWs.send(JSON.stringify(sessionUpdate));
		};

		// OpenAIサーバーとの接続が確立したときのハンドラー
		openAiWs.addEventListener("open", async () => {
			await logMessage(
				"Connected to the OpenAI Realtime API",
				isLocalEnvironment,
				"log",
				streamSid || "unknown",
			);
			openAiConnected = true; // Node.js版にはない
			setTimeout(initializeSession, 100);
		});

		// Listen for messages from the OpenAI WebSocket (and send to client if necessary)
		openAiWs.addEventListener("message", async (event: MessageEvent) => {
			try {
				// データがArrayBufferかどうかをチェック
				const response =
					event.data instanceof ArrayBuffer
						? JSON.parse(new TextDecoder().decode(event.data))
						: JSON.parse(event.data);

				// エラーイベントのみログ出力
				if (response.type === "error") {
					await logMessage(
						`Response: ${JSON.stringify(response)}`,
						isLocalEnvironment,
						"log",
						streamSid || "unknown",
					);
				}

				// Node.js版にはない
				if (response.type === "session.created") {
					openAiConnected = true;
				}

				if (response.type === "response.audio.delta" && response.delta) {
					// 共通ロジックを使用して音声データを処理
					const result = handleAudioDelta(
						response,
						streamSid,
						server,
						responseStartTimestampTwilio,
						latestMediaTimestamp,
						lastAssistantItem,
						markQueue,
					);

					responseStartTimestampTwilio = result.responseStartTimestampTwilio;
					lastAssistantItem = result.lastAssistantItem;
					markQueue = result.markQueue;
				}

				if (response.type === "input_audio_buffer.speech_started") {
					const result = handleSpeechStartedEvent(
						markQueue,
						responseStartTimestampTwilio,
						latestMediaTimestamp,
						lastAssistantItem,
						openAiWs,
						server,
						streamSid,
					);
					markQueue = result.markQueue;
					lastAssistantItem = result.lastAssistantItem;
					responseStartTimestampTwilio = result.responseStartTimestampTwilio;
				}
			} catch (error) {
				const errorMessage = `Error processing OpenAI message: ${error}, Raw message: ${typeof event.data === "string" ? event.data : "binary data"}`;
				await logMessage(
					errorMessage,
					isLocalEnvironment,
					"error",
					streamSid || "unknown",
				);
			}
		});

		// Handle incoming messages from Twilio
		server.addEventListener("message", async (event: MessageEvent) => {
			try {
				// データがArrayBufferかどうかをチェック
				const data =
					event.data instanceof ArrayBuffer
						? JSON.parse(new TextDecoder().decode(event.data))
						: JSON.parse(event.data);

				switch (data.event) {
					case "media":
						latestMediaTimestamp = data.media.timestamp;

						if (openAiWs.readyState === WebSocket.OPEN) {
							// 共通ロジックを使用してメディアメッセージを処理
							handleMediaMessage(data, openAiWs);

							// Node.js版にはない
							// 会話がまだ開始されていない場合は、会話を開始する
							if (openAiConnected && !conversationStarted) {
								// 空の会話アイテムを作成（音声入力用）
								openAiWs.send(JSON.stringify(createConversationItem()));
								// レスポンス作成リクエストを送信
								openAiWs.send(JSON.stringify(createResponseItem()));
								conversationStarted = true;
							}
						}
						break;
					case "start":
						streamSid = data.start.streamSid;
						await logMessage(
							`Incoming stream has started: ${streamSid}`,
							isLocalEnvironment,
							"log",
							streamSid || "unknown",
						);

						// Reset start and media timestamp on a new stream
						responseStartTimestampTwilio = null;
						latestMediaTimestamp = 0;
						break;
					case "mark":
						if (markQueue.length > 0) {
							markQueue.shift();
						}
						break;
					default:
						console.log("👺Received non-media event:", data.event);
						break;
				}
			} catch (error) {
				const errorMessage = `Error parsing Twilio message: ${error}, Message: ${typeof event.data === "string" ? event.data : "binary data"}`;
				await logMessage(
					errorMessage,
					isLocalEnvironment,
					"error",
					streamSid || "unknown",
				);
			}
		});

		// Handle connection close
		server.addEventListener("close", async () => {
			await logMessage(
				"Client disconnected",
				isLocalEnvironment,
				"log",
				streamSid || "unknown",
			);
			if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
		});

		// Handle WebSocket close and errors
		openAiWs.addEventListener("close", async () => {
			await logMessage(
				"Disconnected from the OpenAI Realtime API",
				isLocalEnvironment,
				"log",
				streamSid || "unknown",
			);
			// Node.js版にはない
			openAiConnected = false;
		});

		// OpenAI WebSocket側のエラー発生時のハンドリング
		openAiWs.addEventListener("error", async (error: Event) => {
			await logMessage(
				`Error in the OpenAI WebSocket: ${error}`,
				isLocalEnvironment,
				"error",
				streamSid || "unknown",
			);
		});
	} catch (e) {
		const errorMessage = `Error setting up WebSocket: ${e}`;
		await logMessage(errorMessage, isLocalEnvironment, "error", "setup_error");
		return c.text("Internal Server Error", 500);
	}

	// Node.js版にはない
	// WebSocketの接続を開始
	server.accept();
	// レスポンスを返す
	return new Response(null, {
		status: 101,
		webSocket: client,
	});
};
