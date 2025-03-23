import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { WebSocket } from 'ws';

// Honoインスタンスの作成
export const api = new Hono();

// CORSの設定
api.use('*', cors());

// WebSocketハンドラーの型定義
export type WSHandler = (ws: WebSocket) => void;

// WebSocketコネクションを保持するMap
export const wsConnections = new Map<string, WebSocket>();

// HTTP APIのルート
api.get('/', (c) => {
  return c.json({
    message: 'Welcome to LRW API',
    version: '1.0.0',
  });
});

// ユーザーリストのモックデータ
const users = [
  { id: 1, name: 'User 1' },
  { id: 2, name: 'User 2' },
  { id: 3, name: 'User 3' },
];

// ユーザー一覧を取得するAPI
api.get('/users', (c) => {
  return c.json(users);
});

// 特定のユーザーを取得するAPI
api.get('/users/:id', (c) => {
  const id = Number.parseInt(c.req.param('id'), 10);
  const user = users.find(u => u.id === id);
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json(user);
});

// WebSocketハンドラーを作成する関数
export function createWSHandler(): WSHandler {
  return (ws: WebSocket) => {
    // 接続時の処理
    const connectionId = Date.now().toString();
    wsConnections.set(connectionId, ws);
    
    console.log(`WebSocket connected: ${connectionId}`);
    
    // メッセージ受信時の処理
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Received message:', message);
        
        // エコーバックする
        ws.send(JSON.stringify({
          type: 'echo',
          data: message,
          timestamp: new Date().toISOString()
        }));
        
        // 全クライアントにブロードキャストする
        if (message.broadcast) {
          broadcastMessage({
            type: 'broadcast',
            from: connectionId,
            data: message.data,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    // 接続切断時の処理
    ws.addEventListener('close', () => {
      console.log(`WebSocket disconnected: ${connectionId}`);
      wsConnections.delete(connectionId);
    });
    
    // 初期メッセージを送信
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to LRW WebSocket API',
      connectionId,
      timestamp: new Date().toISOString()
    }));
  };
}

// 全クライアントにメッセージをブロードキャストする関数
export function broadcastMessage(message: Record<string, unknown>): void {
  const messageStr = JSON.stringify(message);
  
  for (const [, ws] of wsConnections) {
    if (ws.readyState === 1) { // WebSocket.OPEN = 1
      ws.send(messageStr);
    }
  }
}
