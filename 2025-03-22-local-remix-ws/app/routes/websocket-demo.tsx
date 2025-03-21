import { useState, useEffect, useRef } from 'react';
import { Link } from '@remix-run/react';
import { WS_PORT } from '~/api/websocket-server';

export default function WebSocketDemo() {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocketの接続を管理する
  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window === 'undefined') return;

    // WebSocketの接続
    const ws = new WebSocket(`ws://localhost:${WS_PORT}`);
    wsRef.current = ws;

    // 接続時の処理
    ws.addEventListener('open', () => {
      console.log('WebSocket connected');
      setConnected(true);
      setMessages(prev => [...prev, 'Connected to WebSocket server']);
    });

    // メッセージ受信時の処理
    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received:', data);
        
        let message = '';
        
        switch (data.type) {
          case 'welcome':
            message = `Welcome! Your connection ID: ${data.connectionId}`;
            break;
          case 'echo':
            message = `Echo: ${JSON.stringify(data.data)}`;
            break;
          case 'broadcast':
            message = `Broadcast from ${data.from}: ${JSON.stringify(data.data)}`;
            break;
          default:
            message = `Received: ${JSON.stringify(data)}`;
        }
        
        setMessages(prev => [...prev, message]);
      } catch (error) {
        console.error('Error parsing message:', error);
        setMessages(prev => [...prev, `Error: ${error}`]);
      }
    });

    // エラー発生時の処理
    ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      setMessages(prev => [...prev, `Error: ${error}`]);
      setConnected(false);
    });

    // 接続切断時の処理
    ws.addEventListener('close', () => {
      console.log('WebSocket disconnected');
      setMessages(prev => [...prev, 'Disconnected from WebSocket server']);
      setConnected(false);
    });

    // コンポーネントのアンマウント時に接続を閉じる
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // メッセージを送信する
  const sendMessage = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !inputValue) {
      return;
    }

    const message = {
      text: inputValue,
      timestamp: new Date().toISOString()
    };

    wsRef.current.send(JSON.stringify(message));
    setInputValue('');
  };

  // ブロードキャストメッセージを送信する
  const sendBroadcast = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !inputValue) {
      return;
    }

    const message = {
      broadcast: true,
      data: {
        text: inputValue,
        timestamp: new Date().toISOString()
      }
    };

    wsRef.current.send(JSON.stringify(message));
    setInputValue('');
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">WebSocket Demo</h1>
      
      <div className="mb-4">
        <Link to="/" className="text-blue-500 hover:underline mr-4">Home</Link>
        <Link to="/api-demo" className="text-blue-500 hover:underline">HTTP API Demo</Link>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded"
            disabled={!connected}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!connected || !inputValue}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Send
          </button>
          <button
            type="button"
            onClick={sendBroadcast}
            disabled={!connected || !inputValue}
            className="px-4 py-2 bg-purple-500 text-white rounded disabled:bg-gray-300"
          >
            Broadcast
          </button>
        </div>
      </div>
      
      <div className="border border-gray-300 rounded p-4 h-96 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages yet</p>
        ) : (
          <ul className="space-y-2">
            {messages.map((message, index) => (
              <li key={`msg-${index}-${message.substring(0, 10)}`} className="border-b border-gray-200 pb-2">
                {message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
