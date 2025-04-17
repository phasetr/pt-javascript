/**
 * Node.js環境用のWebSocket Voice ハンドラー
 *
 * このファイルはNode.js環境でOpenAI Realtime APIを使用した音声対話サーバーを提供します。
 */

import type * as http from "node:http";
import WebSocket, { WebSocketServer } from "ws";
import { logMessage } from "../../utils/logger";
import {
	createSessionUpdateMessage,
	handleAudioDelta,
	handleMediaMessage,
	handleSpeechStartedEvent,
} from "./ws-voice-common";

/**
 * Node.js環境用のWebSocketサーバーを設定するための関数
 * OpenAI Realtime APIを使用した音声対話を処理します
 */
export const wsVoiceNodeHandler = (server: http.Server) => {
	// 環境変数の判定（ローカル環境かどうか）
	// 標準ではfalse、環境変数があり、かつ値がLOCALである場合にのみtrue
	const isLocalEnvironment: boolean = Boolean(
		process.env.ENVIRONMENT && process.env.ENVIRONMENT === "LOCAL",
	);

	// WebSocketサーバーを作成
	const wss = new WebSocketServer({ server, path: "/ws-voice" });

	wss.on("connection", async (connection: WebSocket) => {
		try {
			// Connection-specific state
			let streamSid: string | null = null;
			let latestMediaTimestamp = 0;
			let lastAssistantItem: string | null = null;
			let markQueue: string[] = [];
			let responseStartTimestampTwilio: number | null = null;

			// 環境変数から OPENAI_API_KEY を取得
			const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
			if (!OPENAI_API_KEY) {
				throw new Error("OpenAI API Key is not set");
			}

			const openAiWs = new WebSocket(
				"wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
				{
					headers: {
						Authorization: `Bearer ${OPENAI_API_KEY}`,
						"OpenAI-Beta": "realtime=v1",
						Upgrade: "websocket",
						Connection: "Upgrade",
						"Sec-WebSocket-Version": "13",
						"Sec-WebSocket-Key": btoa(
							Math.random().toString(36).substring(2, 15),
						),
					},
				},
			);

			// セッション初期化
			const initializeSession = () => {
				const sessionUpdate = createSessionUpdateMessage();
				openAiWs.send(JSON.stringify(sessionUpdate));
			};

			// OpenAIサーバーとの接続が確立したときのハンドラー
			openAiWs.on("open", async () => {
				await logMessage(
					"Connected to the OpenAI Realtime API",
					isLocalEnvironment,
					"log",
					streamSid || "unknown",
				);
				setTimeout(initializeSession, 100);
			});

			// Listen for messages from the OpenAI WebSocket (and send to Twilio if necessary)
			openAiWs.on("message", async (data: WebSocket.Data) => {
				try {
					const response = JSON.parse(data.toString());

					// エラーイベントのみログ出力
					if (response.type === "error") {
						await logMessage(
							`Response: ${JSON.stringify(response)}`,
							isLocalEnvironment,
							"log",
							streamSid || "unknown",
						);
					}

					if (response.type === "response.audio.delta" && response.delta) {
						// 共通ロジックを使用して音声データを処理
						const result = handleAudioDelta(
							response,
							streamSid,
							connection,
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
							connection,
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
			connection.on("message", async (message: WebSocket.Data) => {
				try {
					const data = JSON.parse(message.toString());

					switch (data.event) {
						case "media":
							latestMediaTimestamp = data.media.timestamp;

							if (openAiWs.readyState === WebSocket.OPEN) {
								// 共通ロジックを使用してメディアメッセージを処理
								handleMediaMessage(data, openAiWs);
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
			connection.on("close", async () => {
				await logMessage(
					"Client disconnected",
					isLocalEnvironment,
					"log",
					streamSid || "unknown",
				);
				if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
			});

			// Handle WebSocket close and errors
			openAiWs.on("close", async () => {
				await logMessage(
					"Disconnected from the OpenAI Realtime API",
					isLocalEnvironment,
					"log",
					streamSid || "unknown",
				);
			});

			// OpenAI WebSocket側のエラー発生時のハンドリング
			openAiWs.on("error", async (error: Error) => {
				await logMessage(
					`Error in the OpenAI WebSocket: ${error}`,
					isLocalEnvironment,
					"error",
					streamSid || "unknown",
				);
			});
		} catch (e) {
			const errorMessage = `Error setting up WebSocket: ${e}`;
			await logMessage(
				errorMessage,
				isLocalEnvironment,
				"error",
				"setup_error",
			);
		}
	});
};
