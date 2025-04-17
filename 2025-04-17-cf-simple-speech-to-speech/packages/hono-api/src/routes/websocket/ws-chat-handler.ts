/**
 * Cloudflare前提のOpenAI Realtime APIを使用したチャットWebSocketハンドラー
 */

import type { Context } from "hono";
import type { Env } from "hono/types";
import { LOG_EVENT_TYPES, sessionUpdateByString } from "../../constants";
import {
	createCloudflareRealtimeApiWebSocket,
	createConversationItem,
	createResponse,
	nowJst,
} from "../../utils";

// OpenAI APIのレスポンス型定義
interface OpenAIResponse {
	type: string;
	delta?: string;
	item_id?: string;
	[key: string]: unknown;
}

// 環境変数の型拡張
type EnvWithOpenAI = Env & {
	OPENAI_API_KEY?: string;
};

/**
 * Cloudflare前提のOpenAI Realtime APIを使用したチャットWebSocketハンドラー
 * クライアントからのメッセージをOpenAI APIに送信し、レスポンスを段落ごとに返します
 */
export const wsChatHandler = async (
	c: Context<{ Bindings: EnvWithOpenAI }>,
) => {
	// WebSocketの接続をアップグレード
	const upgradeHeader = c.req.header("Upgrade");
	if (!upgradeHeader || upgradeHeader !== "websocket") {
		return c.text("Expected Upgrade: websocket", 400);
	}

	// OpenAIのAPIキー取得
	const OPENAI_API_KEY = c.env.OPENAI_API_KEY;
	if (!OPENAI_API_KEY) {
		console.error("YOU MUST SET AN OPENAI_API_KEY!");
		return c.text("OpenAI API Key is not set", 500);
	}

	// WebSocketPairの作成
	const webSocketPair = new WebSocketPair();
	const client = webSocketPair[0];
	const server = webSocketPair[1];

	// 接続固有の状態
	const streamSidRef = { value: null as string | null };
	/** クライアントに返すメッセージをためる配列 */
	const returnMessages: string[] = [];

	// OpenAIとのWebSocket接続を作成
	const openAiWs = await createCloudflareRealtimeApiWebSocket(OPENAI_API_KEY);

	// OpenAIサーバーとの接続状態管理
	let openAiConnected = false;

	// WebSocketの接続が確立された直後にセッション更新メッセージを送信
	openAiWs.send(JSON.stringify(sessionUpdateByString));

	// OpenAIサーバーとの接続が確立したときのハンドラー
	openAiWs.addEventListener("open", () => {
		console.log("Connected to the OpenAI Realtime API");
		openAiConnected = true;
	});

	// OpenAI WebSocket側のcloseイベントのハンドリング
	openAiWs.addEventListener("close", () => {
		console.log("Disconnected from the OpenAI Realtime API");
		openAiConnected = false;
	});

	// OpenAI WebSocket側のエラー発生時のハンドリング
	openAiWs.addEventListener("error", (error: Event) => {
		console.error("OpenAI WebSocketエラー:", error);
		if (error instanceof Error) {
			console.error("エラーメッセージ:", error.message);
		}
	});

	// OpenAI WebSocketからのメッセージ処理
	openAiWs.addEventListener("message", (event: MessageEvent) => {
		try {
			// データがArrayBufferの場合は文字列に変換
			const data =
				typeof event.data === "string"
					? event.data
					: new TextDecoder().decode(event.data);

			const response = JSON.parse(data);

			if (LOG_EVENT_TYPES.includes(response.type)) {
				console.log(`Received event: ${response.type}`);
			}

			// エラーイベントの詳細を表示
			if (response.type === "error") {
				console.error("OpenAI Realtime API error:", response);
			}

			// session.createdイベントを受信したときにopenAiConnectedフラグをtrueに設定
			if (response.type === "session.created") {
				openAiConnected = true;
			}

			// レスポンスタイプに応じた処理
			handleOpenAIResponse(response, server, returnMessages);
		} catch (error) {
			console.error(
				"Error processing OpenAI message:",
				error,
				"Raw message:",
				event.data,
			);
		}
	});

	// クライアントからのメッセージを処理
	server.addEventListener("message", (event: MessageEvent) => {
		try {
			// データがArrayBufferの場合は文字列に変換
			const data =
				typeof event.data === "string"
					? event.data
					: new TextDecoder().decode(event.data);

			handleClientMessage(data, openAiWs, openAiConnected, streamSidRef);
		} catch (e) {
			console.error(e);
		}
	});

	// エラー発生時のイベントハンドラー
	server.addEventListener("error", (event: Event) => {
		console.error("WebSocket error:", event);
	});

	// 接続が閉じられたときのイベントハンドラー
	server.addEventListener("close", () => {
		console.log("WebSocket connection closed");
		if (openAiConnected) {
			openAiWs.close();
			openAiConnected = false;
		}
	});

	// クライアントに接続成功メッセージを送信
	server.accept();
	server.send("We connected to you!");

	// レスポンスを返す
	return new Response(null, {
		status: 101,
		webSocket: client,
	});
};

/**
 * OpenAIからのレスポンスを処理する関数
 */
export function handleOpenAIResponse(
	response: OpenAIResponse,
	server: WebSocket,
	returnMessages: string[],
): void {
	switch (response.type) {
		case "response.text.delta":
			// deltaが存在することを確認
			if (typeof response.delta !== "string") {
				console.error("Received delta is not a string:", response.delta);
				return;
			}

			// 差分を配列にためる
			returnMessages.push(response.delta);

			// 部分的に段落の区切りが含まれているか確認
			if (response.delta.includes("\n\n")) {
				// すべての差分を一度連結して段落に分割
				const paragraphs = returnMessages.join("").split("\n\n");
				// 最後の要素はまだ完結していない可能性があるので取り除く
				const completeParagraphs = paragraphs.slice(0, -1);
				const remainder = paragraphs[paragraphs.length - 1];

				for (const para of completeParagraphs) {
					if (server.readyState === WebSocket.OPEN) {
						server.send(para);
					}
				}
				// 未完の段落部分を再度蓄積する
				returnMessages.length = 0; // 配列をクリア
				returnMessages.push(remainder);
			}
			break;
		case "response.text.done":
			// 最終的なテキストを組み立て、段落ごとに分割して送信
			{
				const fullMessage = returnMessages.join("");
				const paragraphs = fullMessage.split("\n\n");

				for (const para of paragraphs) {
					if (para.trim() !== "" && server.readyState === WebSocket.OPEN) {
						server.send(para);
					}
				}
			}
			returnMessages.length = 0; // 配列をクリア
			break;
		case "response.done":
			if (server.readyState === WebSocket.OPEN) {
				server.send("👺THE END OF RESPONSE👺\n");
			}
			break;
	}
}

/**
 * クライアントからのメッセージを処理する関数
 */
export function handleClientMessage(
	data: string,
	openAiWs: WebSocket,
	openAiConnected: boolean,
	streamSidRef: { value: string | null },
): void {
	switch (data) {
		case "--delete":
			streamSidRef.value = nowJst().toString();
			console.log(`Incoming stream has started: ${streamSidRef.value}`);
			break;
		case "":
			console.log("Input is empty.");
			break;
		default:
			if (openAiConnected) {
				const conversationItem = createConversationItem(data);
				openAiWs.send(JSON.stringify(conversationItem));

				const responseItem = createResponse();
				openAiWs.send(JSON.stringify(responseItem));
			} else {
				console.warn(
					"OpenAIとの接続が確立されていないため、メッセージを送信できません",
				);
			}
			break;
	}
}
