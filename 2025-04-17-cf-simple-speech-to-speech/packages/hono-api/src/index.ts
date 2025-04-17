/**
 * Hono API サーバー (Cloudflare Workers環境用)
 *
 * このファイルはCloudflare Workers環境用です。
 * Node.js環境では index.node.ts を使用してください。
 *
 * - Run `npm run dev` in your terminal to start a Cloudflare Workers development server
 * - Run `npm run deploy` to publish your worker to Cloudflare
 */

import type { Context, Next } from "hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Honoアプリケーションの作成
const app = new Hono<{
	Bindings: {
		OPENAI_API_KEY?: string;
		SERVICE_URL?: string;
		ENVIRONMENT?: string;
		CLOUDFLARE?: string;
	};
}>();

// ミドルウェアの設定
app.use("*", async (c: Context, next: Next) => {
	c.set("envVars", {
		SERVICE_URL: c.env.SERVICE_URL || "",
		OPENAI_API_KEY: c.env.OPENAI_API_KEY || "",
		ENVIRONMENT: c.env.ENVIRONMENT || "development",
		CLOUDFLARE: c.env.CLOUDFLARE || "true",
	});
	await next();
});
app.use("*", logger());
app.use("*", cors());

// エンドポイント
app.get("/", (c: Context) => {
	return c.json({
		message: "CWHDT API Server on Cloudflare",
		version: "1.0.0",
	});
});

app.all("/incoming-call", async (c: Context) => {
	try {
		const envVars = c.get("envVars");
		const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
    <Say>You can start talking on Cloudflare!</Say>
    <Connect>
      <Stream url="wss://${envVars.SERVICE_URL}/ws-voice" />
    </Connect>
  </Response>`;
		return c.text(twimlResponse, 200, {
			"Content-Type": "text/xml",
		});
	} catch (e) {
		console.error("環境変数の取得に失敗しました。", e);
		const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
    <Say>We have some errors, sorry.</Say>
  </Response>`;
		return c.text(twimlResponse, 200, {
			"Content-Type": "text/xml",
		});
	}
});

app.get(
	"/ws-voice",
	async (
		c: Context<{
			Bindings: {
				OPENAI_API_KEY?: string;
				SERVICE_URL?: string;
				ENVIRONMENT?: string;
				CLOUDFLARE?: string;
			};
		}>,
	) => {
		const webSocketPair = new WebSocketPair();
		const client = webSocketPair[0];
		const server = webSocketPair[1];

		try {
			// Node.js版にはない
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
			const openAiWs = await (async () => {
				try {
					const response = await fetch(
						"https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
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

					return webSocket;
				} catch (error) {
					console.error("👺WebSocket接続エラー:", error);
					throw error;
				}
			})();

			// OpenAIサーバーとの接続が確立したときのハンドラー
			openAiWs.addEventListener("open", async () => {
				openAiConnected = true; // Node.js版にはない
				setTimeout(() => {
					const sessionUpdate = {
						type: "session.update",
						session: {
							turn_detection: { type: "server_vad" },
							input_audio_format: "g711_ulaw",
							output_audio_format: "g711_ulaw",
							voice: "alloy",
							instructions: "Respond simply.",
							modalities: ["text", "audio"],
							temperature: 0.8,
						},
					};
					openAiWs.send(JSON.stringify(sessionUpdate));
				}, 100);
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
						console.error("👺OpenAI Realtime API Error:", response);
					}

					// Node.js版にはない
					if (response.type === "session.created") {
						openAiConnected = true;
					}

					if (response.type === "response.audio.delta" && response.delta) {
						// インライン化: handleAudioDelta
						const audioDelta = {
							event: "media",
							streamSid: streamSid,
							media: { payload: response.delta },
						};
						server.send(JSON.stringify(audioDelta));

						// First delta from a new response starts the elapsed time counter
						if (!responseStartTimestampTwilio) {
							responseStartTimestampTwilio = latestMediaTimestamp;
						}

						if (response.item_id) {
							lastAssistantItem = response.item_id;
						}

						// インライン化: sendMark
						if (streamSid) {
							const markEvent = {
								event: "mark",
								streamSid: streamSid,
								mark: { name: "responsePart" },
							};
							server.send(JSON.stringify(markEvent));
							markQueue.push("responsePart");
						}
					}

					if (response.type === "input_audio_buffer.speech_started") {
						// インライン化: handleSpeechStartedEvent
						if (markQueue.length > 0 && responseStartTimestampTwilio != null) {
							const elapsedTime =
								latestMediaTimestamp - responseStartTimestampTwilio;

							if (lastAssistantItem) {
								const truncateEvent = {
									type: "conversation.item.truncate",
									item_id: lastAssistantItem,
									content_index: 0,
									audio_end_ms: elapsedTime,
								};
								openAiWs.send(JSON.stringify(truncateEvent));
							}

							server.send(
								JSON.stringify({
									event: "clear",
									streamSid: streamSid,
								}),
							);

							markQueue = [];
							lastAssistantItem = null;
							responseStartTimestampTwilio = null;
						}
					}
				} catch (error) {
					console.error("👺Error processing OpenAI message:", error);
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
								// インライン化: handleMediaMessage
								const audioAppend = {
									type: "input_audio_buffer.append",
									audio: data.media.payload,
								};
								openAiWs.send(JSON.stringify(audioAppend));

								// Node.js版にはない
								// 会話がまだ開始されていない場合は、会話を開始する
								if (openAiConnected && !conversationStarted) {
									// 空の会話アイテムを作成（音声入力用）
									openAiWs.send(
										JSON.stringify({
											type: "conversation.item.create",
											item: {
												type: "message",
												role: "user",
												content: [],
											},
										}),
									);
									// レスポンス作成リクエストを送信
									openAiWs.send(
										JSON.stringify({
											type: "response.create",
											response: {
												modalities: ["text", "audio"],
												instructions: "Respond simply.",
											},
										}),
									);
									conversationStarted = true;
								}
							}
							break;
						case "start":
							streamSid = data.start.streamSid;
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
							break;
					}
				} catch (error) {
					console.error("👺Error processing Twilio message:", error);
				}
			});

			// Handle connection close
			server.addEventListener("close", async () => {
				if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
			});

			// Handle WebSocket close and errors
			openAiWs.addEventListener("close", async () => {
				// Node.js版にはない
				openAiConnected = false;
			});

			// OpenAI WebSocket側のエラー発生時のハンドリング
			openAiWs.addEventListener("error", async (error: Event) => {
				console.error("👺OpenAI WebSocket error:", error);
			});
		} catch (e) {
			console.error("👺WebSocket接続エラー:", e);
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
	},
);

export default app;
