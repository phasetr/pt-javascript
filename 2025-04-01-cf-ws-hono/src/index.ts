import { Hono } from "hono";
import { cors } from "hono/cors";

// APIサーバーとして特化させる
const app = new Hono<{ Bindings: CloudflareBindings }>();

// CORSミドルウェアを追加
app.use("*", cors());

// ヘルスチェック用エンドポイント
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

// API情報を返すエンドポイント
app.get("/api/info", (c) => {
  return c.json({
    name: "Cloudflare WebSocket Hono API",
    version: "1.0.0",
    description: "WebSocketサーバーの検証用APIサーバー"
  });
});

// WebSocketエンドポイント
app.get("/ws", (c) => {
  // WebSocketの接続をアップグレード
  const upgradeHeader = c.req.header("Upgrade");
  if (upgradeHeader !== "websocket") {
    return c.text("Expected Upgrade: websocket", 400);
  }

  // WebSocketの接続を確立
  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  // サーバー側のWebSocketイベントハンドラを設定
  server.accept();

  // 接続時のメッセージ
  server.send(JSON.stringify({
    type: "connected",
    message: "WebSocket接続が確立されました",
    timestamp: new Date().toISOString()
  }));

  // メッセージ受信時のハンドラ
  server.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data as string);
      console.log("受信メッセージ:", data);

      // エコーレスポンス
      server.send(JSON.stringify({
        type: "echo",
        message: data.message || "メッセージがありません",
        originalData: data,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      // JSONでないメッセージの場合
      server.send(JSON.stringify({
        type: "error",
        message: "無効なJSONフォーマット",
        originalMessage: event.data,
        timestamp: new Date().toISOString()
      }));
    }
  });

  // 接続終了時のハンドラ
  server.addEventListener("close", (event) => {
    console.log("WebSocket接続が終了しました", event);
  });

  // エラー発生時のハンドラ
  server.addEventListener("error", (event) => {
    console.error("WebSocketエラー:", event);
  });

  // クライアント側のWebSocketを返す
  return new Response(null, {
    status: 101,
    webSocket: client
  });
});

export default app;
