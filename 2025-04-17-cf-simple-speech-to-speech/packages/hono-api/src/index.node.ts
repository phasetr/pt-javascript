/**
 * Hono API サーバー (Node.js環境用)
 *
 * メール送信用のエンドポイントとWebSocketを提供します。
 * このファイルはNode.js環境用です。
 * Cloudflare Workers環境では index.ts を使用してください。
 *
 * - Run `npm run dev:node` to start a Node.js development server
 */

import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import type { Context, Next } from "hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type * as http from "node:http";
import WebSocket, { WebSocketServer } from "ws";

// .envファイルを読み込む
dotenv.config();
const SYSTEM_MESSAGE = "Respond simply.";

/**
 * セッション初期化用のメッセージを作成
 */
const createSessionUpdateMessage = () => {
	return {
		type: "session.update",
		session: {
			turn_detection: { type: "server_vad" },
			input_audio_format: "g711_ulaw",
			output_audio_format: "g711_ulaw",
			voice: "alloy",
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
interface WebSocketLike {
	send(data: string): void;
	readyState?: number;
}

/**
 * 音声入力が開始された時の処理
 * AIの応答を途中で切り上げる
 */
const handleSpeechStartedEvent = (
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
const sendMark = (
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
const handleAudioDelta = (
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
const handleMediaMessage = (
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

// =======================================
// ミドルウェア
// =======================================

/**
 * アプリケーションで使用する環境変数の型定義
 */
type AppEnvVars = {
	SERVICE_URL: string;
	OPENAI_API_KEY: string;
	ENVIRONMENT: string;
	CLOUDFLARE: string;
	// 必要に応じて他の環境変数を追加
	[key: string]: string | undefined;
};

/**
 * 環境変数をコンテキストに追加するための型拡張
 */
declare module "hono" {
	interface ContextVariableMap {
		envVars: AppEnvVars;
	}
}

/**
 * Node.js環境用の環境変数ミドルウェア
 * process.envから環境変数を取得し、コンテキストにセットする
 */
const nodeEnvMiddleware = async (c: Context, next: Next) => {
	const envVars: AppEnvVars = {
		SERVICE_URL: process.env.SERVICE_URL || "",
		OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
		ENVIRONMENT: process.env.ENVIRONMENT || "development",
		CLOUDFLARE: process.env.CLOUDFLARE || "false", // Node.js環境ではデフォルトでfalse
		// 必要に応じて他の環境変数を追加
	};

	// コンテキストに環境変数をセット
	c.set("envVars", envVars);
	await next();
};

// =======================================
// ハンドラー
// =======================================

/**
 * ルートエンドポイントのハンドラー関数
 * APIの基本情報と利用可能なエンドポイントの一覧を返します
 * 環境変数CLOUDFLAREの値に基づいて実行環境を判定し、メッセージを切り替えます
 */
const rootHandler = (c: Context) => {
	// 環境変数からCloudflare環境かどうかを判定
	// .dev.varsまたは.envファイルのCLOUDFLARE環境変数を使用
	const envVars = c.get("envVars");
	const isCloudflare = envVars?.CLOUDFLARE === "true";
	const environment = isCloudflare ? "Cloudflare" : "Node.js";

	return c.json({
		message: `CWHDT API Server on ${environment}`,
		version: "1.0.0",
		environment,
	});
};

/**
 * Twilioからの着信コールを処理するエンドポイント
 * TwiMLレスポンスを返し、WebSocketストリームへの接続を指示する
 */
const incomingCallHandler = async (c: Context) => {
	try {
		// ミドルウェアでセットされた環境変数を取得
		const envVars = c.get("envVars");
		const isCloudflare = envVars?.CLOUDFLARE === "true";
		const environment = isCloudflare ? "Cloudflare" : "Node.js";
		const SERVICE_URL = envVars.SERVICE_URL;
		if (!SERVICE_URL) {
			throw new Error("SERVICE_URL is not configured");
		}

		const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
    <Pause length="2"/>
    <Say>Hello, I am an assistant on ${environment}!</Say>
    <Pause length="1"/>
    <Say>You can start talking!</Say>
    <Connect>
      <Stream url="wss://${SERVICE_URL}/ws-voice" />
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
};

/**
 * Cloudflare環境用のWebSocket Voice ハンドラー
 * このハンドラーはNode.js環境では使用されませんが、
 * インターフェースの一貫性のために含めています
 */
const wsVoiceHandler = async (c: Context) => {
	return c.text(
		"This endpoint is only available in Cloudflare Workers environment",
		400,
	);
};

/**
 * Node.js環境用のWebSocketサーバーを設定するための関数
 * OpenAI Realtime APIを使用した音声対話を処理します
 */
const wsVoiceNodeHandler = (server: http.Server) => {
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
				setTimeout(initializeSession, 100);
			});

			// Listen for messages from the OpenAI WebSocket (and send to Twilio if necessary)
			openAiWs.on("message", async (data: WebSocket.Data) => {
				try {
					const response = JSON.parse(data.toString());

					// エラーイベントのみログ出力
					if (response.type === "error") {
						console.error("OpenAI API Error:", response);
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
					console.error("Error processing OpenAI message:", error);
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
					console.error("Error processing Twilio message:", error);
				}
			});

			// Handle connection close
			connection.on("close", async () => {
				if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
			});

			// Handle WebSocket close and errors
			openAiWs.on("close", async () => {});

			// OpenAI WebSocket側のエラー発生時のハンドリング
			openAiWs.on("error", async (error: Error) => {});
		} catch (e) {
			console.error("WebSocket setup error:", e);
		}
	});
};

// =======================================
// アプリケーション設定
// =======================================

// 型定義
type Env = {
	OPENAI_API_KEY?: string;
	SERVICE_URL?: string;
	ENVIRONMENT?: string;
	[key: string]: unknown;
};

// Honoアプリケーションの作成
const app = new Hono<{ Bindings: Env }>();

// ミドルウェアの設定
app.use("*", nodeEnvMiddleware); // 環境変数ミドルウェアを最初に適用
app.use("*", logger());
app.use("*", cors());

// エンドポイント
app.get("/", rootHandler);
app.get("/ws-voice", wsVoiceHandler);
app.all("/incoming-call", incomingCallHandler);

// Node.js環境でサーバーを起動
if (process.env.NODE_ENV !== "test") {
	const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;
	console.log(`Starting Hono server on port ${port} in Node.js environment`);
	const server = serve({
		fetch: app.fetch,
		port,
	});
	// WebSocketサーバーをセットアップ
	wsVoiceNodeHandler(server as unknown as http.Server);
}

export default app;
