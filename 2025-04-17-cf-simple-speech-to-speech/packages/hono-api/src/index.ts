/**
 * Hono API サーバー (Cloudflare Workers環境用)
 *
 * このファイルはCloudflare Workers環境用です。
 * Node.js環境では index.node.ts を使用してください。
 *
 * - Run `npm run dev` in your terminal to start a Cloudflare Workers development server
 * - Run `npm run deploy` to publish your worker to Cloudflare
 */

import type { Context, MiddlewareHandler } from "hono"; // Context と MiddlewareHandler をインポート (重複を削除)
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const SYSTEM_MESSAGE = "Respond simply.";

/**
 * WebSocketの共通インターフェース
 * CloudflareとNode.jsの両方の環境で動作するように
 */
interface WebSocketLike {
	send(data: string): void;
	readyState?: number;
}

/**
 * セッション初期化用のメッセージを作成
 */
function createSessionUpdateMessage() {
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
}

/**
 * 音声入力が開始された時の処理
 * AIの応答を途中で切り上げる
 */
function handleSpeechStartedEvent(
	markQueue: string[],
	responseStartTimestampTwilio: number | null,
	latestMediaTimestamp: number,
	lastAssistantItem: string | null,
	openAiWs: WebSocketLike,
	serverWs: WebSocketLike,
	streamSid: string | null,
) {
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
}

/**
 * マークメッセージを送信
 * AIの応答再生が完了したかどうかを確認するため
 */
function sendMark(
	connection: WebSocketLike,
	streamSid: string | null,
	markQueue: string[],
) {
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
}

/**
 * OpenAIからの音声データを処理
 */
function handleAudioDelta(
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
) {
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
}

/**
 * Twilioからのメディアメッセージを処理
 */
function handleMediaMessage(
	data: {
		media: {
			payload: string;
			timestamp?: number;
		};
	},
	openAiWs: WebSocketLike,
) {
	const audioAppend = {
		type: "input_audio_buffer.append",
		audio: data.media.payload,
	};
	openAiWs.send(JSON.stringify(audioAppend));
}

/**
 * 会話開始メッセージを作成
 */
function createConversationItem() {
	return {
		type: "conversation.item.create",
		item: {
			type: "message",
			role: "user",
			content: [],
		},
	};
}

/**
 * レスポンス作成リクエストを作成
 */
function createResponseItem() {
	return {
		type: "response.create",
		response: {
			modalities: ["text", "audio"],
			instructions: SYSTEM_MESSAGE,
		},
	};
}

/**
 * Cloudflare Workers環境でOpenAI Realtime APIに接続するためのWebSocketを作成する
 *
 * @param openai_api_key OpenAI APIキー
 * @returns Cloudflare Workers環境でのWebSocket接続
 */
async function createCloudflareRealtimeApiWebSocket(
	openai_api_key: string,
): Promise<WebSocket> {
	try {
		const response = await fetch(
			"https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
			{
				headers: {
					Authorization: `Bearer ${openai_api_key}`,
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

		console.log("👺OpenAI Realtime API WebSocket connection established");
		return webSocket;
	} catch (error) {
		console.error("👺WebSocket接続エラー:", error);
		throw error;
	}
}

/**
 * 日本時間の現在時刻を文字列で返す
 */
function nowJst() {
	const now = new Date();
	return now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

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
 * Cloudflare Workers環境用の環境変数ミドルウェア
 * c.envから環境変数を取得し、コンテキストにセットする
 */
const cloudflareEnvMiddleware: MiddlewareHandler<{
	// export を削除
	Bindings: Record<string, string | undefined>;
}> = async (c, next) => {
	const envVars: AppEnvVars = {
		SERVICE_URL: c.env.SERVICE_URL || "",
		OPENAI_API_KEY: c.env.OPENAI_API_KEY || "",
		ENVIRONMENT: c.env.ENVIRONMENT || "development",
		CLOUDFLARE: c.env.CLOUDFLARE || "true", // Cloudflare環境ではデフォルトでtrue
		// 必要に応じて他の環境変数を追加
	};

	// コンテキストに環境変数をセット
	c.set("envVars", envVars);
	await next();
};

// 型定義
type Env = {
	OPENAI_API_KEY?: string;
	SERVICE_URL?: string;
	ENVIRONMENT?: string;
	CLOUDFLARE?: string;
	[key: string]: unknown;
};

// Honoアプリケーションの作成
const app = new Hono<{ Bindings: Env }>();

// ミドルウェアの設定
app.use("*", cloudflareEnvMiddleware); // 環境変数ミドルウェアを最初に適用
app.use("*", logger());
app.use("*", cors());

// エンドポイント
// incomingCallHandler の定義 (nowJst は後で追加)
const incomingCallHandler = async (c: Context) => {
	try {
		console.log(`👺This is get /incoming-call: ${nowJst()}`); // nowJst() は未定義
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
 * Cloudflare環境用のWebSocketサーバーを設定するための関数
 * OpenAI Realtime APIを使用した音声対話を処理します
 */
const wsVoiceHandler = async (
	c: Context<{
		Bindings: Env & { OPENAI_API_KEY?: string; ENVIRONMENT?: string };
	}>,
) => {
	// 環境変数の判定（ローカル環境かどうか）
	// 標準ではfalse、環境変数があり、かつ値がLOCALである場合にのみtrue

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
					console.error("👺OpenAI Realtime API Error:", response);
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
};

// エンドポイント
app.get("/", rootHandler);
app.get("/ws-voice", wsVoiceHandler);
app.all("/incoming-call", incomingCallHandler);

export default app;
