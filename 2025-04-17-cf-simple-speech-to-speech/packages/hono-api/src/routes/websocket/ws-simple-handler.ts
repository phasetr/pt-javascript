/**
 * Cloudflare前提のシンプルなWebSocketエコーハンドラー
 */

import type { Context } from "hono";
import type { Env } from "hono/types";

/**
 * Cloudflare前提のシンプルなWebSocketエコーハンドラー
 * クライアントからのメッセージをそのまま返します
 */
export const wsSimpleHandler = (c: Context<{ Bindings: Env }>) => {
	// WebSocketの接続をアップグレード
	const upgradeHeader = c.req.header("Upgrade");

	if (!upgradeHeader || upgradeHeader !== "websocket") {
		return c.text("Expected Upgrade: websocket", 400);
	}

	// WebSocketの接続を確立
	const webSocketPair = new WebSocketPair();
	const client = webSocketPair[0];
	const server = webSocketPair[1];

	// メッセージを受信したときのイベントハンドラー
	server.addEventListener("message", (event: MessageEvent) => {
		// 受信したメッセージをそのまま返す
		server.send(`Your input is: ${event.data}`);
	});

	// エラー発生時のイベントハンドラー
	server.addEventListener("error", (event: Event) => {
		console.error("WebSocket error:", event);
	});

	// 接続が閉じられたときのイベントハンドラー
	server.addEventListener("close", () => {
		console.log("WebSocket connection closed");
	});

	// WebSocketの接続を開始
	server.accept();

	// レスポンスを返す
	return new Response(null, {
		status: 101,
		webSocket: client,
	});
};
