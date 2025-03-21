import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { startWebSocketServer } from '~/api/websocket-server';

// WebSocketサーバーを起動
startWebSocketServer();

// モックデータ
const users = [
  { id: 1, name: 'User 1' },
  { id: 2, name: 'User 2' },
  { id: 3, name: 'User 3' },
];

// HTTP APIリクエストを直接処理するローダー関数
export async function loader({ request, params }: LoaderFunctionArgs) {
  // URLからAPIパスを抽出
  const path = params['*'] || '';
  
  console.log('API Request:', path);
  
  // Content-Typeヘッダーを設定
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  try {
    // パスに基づいてAPIリクエストを処理
    if (path === '' || path === '/') {
      return new Response(JSON.stringify({
        message: 'Welcome to LRW API',
        version: '1.0.0',
      }), { headers });
    }
    
    if (path === 'users') {
      return new Response(JSON.stringify(users), { headers });
    }
    
    if (path.startsWith('users/')) {
      const userId = Number.parseInt(path.replace('users/', ''), 10);
      const user = users.find(u => u.id === userId);
      
      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), { 
          status: 404, 
          headers 
        });
      }
      
      return new Response(JSON.stringify(user), { headers });
    }
    
    // 未知のパスの場合は404を返す
    return new Response(JSON.stringify({ error: 'Not Found' }), { 
      status: 404, 
      headers 
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500, 
      headers 
    });
  }
}

// POSTリクエストなどを処理するアクション関数
export async function action({ request, params }: ActionFunctionArgs) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  // OPTIONSリクエストの場合はCORSヘッダーを返す
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  
  try {
    const body = await request.json();
    console.log('API Request Body:', body);
    
    // ここでPOSTリクエストなどを処理
    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (error) {
    console.error('API Action Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500, 
      headers 
    });
  }
}

// このコンポーネントは実際にはレンダリングされない
export default function ApiRoute() {
  return null;
}
