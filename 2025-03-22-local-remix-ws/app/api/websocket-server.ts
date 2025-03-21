import { WebSocketServer } from 'ws';
import { createWSHandler } from './hono';

// WebSocketサーバーのポート
export const WS_PORT = 8080;

// サーバーインスタンスを追跡するグローバル変数
let serverInstance: WebSocketServer | null = null;

// WebSocketサーバーを起動する関数
export function startWebSocketServer(): void {
  // サーバーサイドでのみ実行
  if (typeof process === 'undefined' || !process.env.NODE_ENV) {
    return;
  }

  // サーバーが既に起動している場合は何もしない
  if (serverInstance) {
    return;
  }

  try {
    serverInstance = new WebSocketServer({ port: WS_PORT });
    
    serverInstance.on('connection', createWSHandler());
    
    console.log(`WebSocket server is running on ws://localhost:${WS_PORT}`);
    
    // エラーハンドリング
    serverInstance.on('error', (error) => {
      console.error('WebSocket server error:', error);
      
      // ポートが既に使用されている場合は、サーバーインスタンスをnullに設定
      if ((error as any).code === 'EADDRINUSE') {
        console.log(`Port ${WS_PORT} is already in use. WebSocket server not started.`);
        serverInstance = null;
      }
    });
  } catch (error) {
    console.error('Failed to start WebSocket server:', error);
    serverInstance = null;
  }
}
