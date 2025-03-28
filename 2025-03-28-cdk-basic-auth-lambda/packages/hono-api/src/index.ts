import { serve } from "@hono/node-server";
import { handle } from "hono/aws-lambda";
import app from "./app.js";

// 開発環境ではローカルサーバーを起動
if (process.env.NODE_ENV !== "production") {
  console.log("Starting local server on http://localhost:3000");
  serve({
    fetch: app.fetch,
    port: 3000
  });
}

// AWS Lambda用のハンドラをエクスポート
export const handler = handle(app);
