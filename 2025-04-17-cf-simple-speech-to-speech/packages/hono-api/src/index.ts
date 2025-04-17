/**
 * Hono API サーバー (Cloudflare Workers環境用)
 *
 * メール送信用のエンドポイントとWebSocketを提供します。
 * このファイルはCloudflare Workers環境用です。
 * Node.js環境では index.node.ts を使用してください。
 *
 * - Run `npm run dev` in your terminal to start a Cloudflare Workers development server
 * - Run `npm run dev:node` to start a Node.js development server
 * - Run `npm run deploy` to publish your worker to Cloudflare
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { cloudflareEnvMiddleware } from "./middleware/env-middleware";
import { incomingCallHandler } from "./routes/incoming-call";
import { rootHandler } from "./routes/root";
import { wsVoiceHandler } from "./routes/websocket";

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
app.get("/", rootHandler);
app.get("/ws-voice", wsVoiceHandler);
app.all("/incoming-call", incomingCallHandler);

export default app;
