import { handle } from "hono/aws-lambda";
import app from "./app.js";

// index.ts で定義された純粋なHTTPサーバをAWS Lambda用のアダプタでラップしてハンドラとしてエクスポート
export const handler = handle(app);
