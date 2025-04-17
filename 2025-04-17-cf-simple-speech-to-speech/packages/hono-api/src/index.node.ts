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
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type * as http from "node:http";
import { nodeEnvMiddleware } from "./middleware/env-middleware";
import { incomingCallHandler } from "./routes/incoming-call";
import { rootHandler } from "./routes/root";
import { wsVoiceHandler } from "./routes/websocket";
import { wsVoiceNodeHandler } from "./routes/websocket/ws-voice-node-handler";

// .envファイルを読み込む
dotenv.config();

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
