import { Hono } from 'hono';
import { createNodeWebSocket } from "@hono/node-ws";
import { cors } from 'hono/cors';

function nowJst() {
  const now = new Date();
  return now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

const app = new Hono();

// CORSを設定して開発サーバー(5173ポート)からのアクセスを許可
app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
}));

// ベースパスを変更し、このファイルのルートパスに合わせる
app.get('/', (c) => {
  const jst = nowJst();
  console.log(`現在の日本時刻: ${jst}`);
  return c.json({ message: `Hello from hono within Remix: ${jst}` });
});

// RemixのloaderでHonoハンドラを呼び出す
export const loader = async ({ request }: { request: Request }) => {
  // WebSocketリクエストの場合は直接処理
  if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
    return await app.fetch(request);
  }

  // 通常のHTTPリクエストの場合はパスを調整
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/hono', '');
  url.pathname = path;
  const newRequest = new Request(url.toString(), request);
  return await app.fetch(newRequest);
};

// actionも同様に実装
export const action = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/hono', '');
  url.pathname = path;
  const newRequest = new Request(url.toString(), request);
  return await app.fetch(newRequest);
};
