import { useState } from 'react';
import { Link } from '@remix-run/react';

export default function ApiDemo() {
  const [result, setResult] = useState<{ status: number; data: Record<string, unknown> } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api');

  // 利用可能なAPIエンドポイント
  const endpoints = [
    { path: '/api', name: 'API Root' },
    { path: '/api/users', name: 'Get All Users' },
    { path: '/api/users/1', name: 'Get User 1' },
    { path: '/api/users/999', name: 'Get Non-existent User (Error)' },
  ];

  // APIを呼び出す関数
  const fetchApi = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // APIリクエストを送信
      const response = await fetch(selectedEndpoint, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      // レスポンスのテキストを取得
      const text = await response.text();
      
      try {
        // JSONとしてパース
        const data = JSON.parse(text);
        
        setResult({
          status: response.status,
          data
        });
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        setError(`Failed to parse response as JSON: ${text.substring(0, 100)}...`);
      }
    } catch (err) {
      console.error('API Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">HTTP API Demo</h1>
      
      <div className="mb-4">
        <Link to="/" className="text-blue-500 hover:underline mr-4">Home</Link>
        <Link to="/websocket-demo" className="text-blue-500 hover:underline">WebSocket Demo</Link>
      </div>
      
      <div className="mb-4">
        <div className="block mb-2 font-medium">Select API Endpoint:</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {endpoints.map((endpoint) => (
            <button
              key={endpoint.path}
              type="button"
              onClick={() => setSelectedEndpoint(endpoint.path)}
              className={`px-3 py-1 rounded ${
                selectedEndpoint === endpoint.path
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {endpoint.name}
            </button>
          ))}
        </div>
        
        <div className="flex items-center mb-4">
          <span className="font-mono bg-gray-100 p-2 rounded flex-1">{selectedEndpoint}</span>
          <button
            type="button"
            onClick={fetchApi}
            disabled={loading}
            className="ml-2 px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
          >
            {loading ? 'Loading...' : 'Send Request'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {result && (
        <div className="border border-gray-300 rounded overflow-hidden">
          <div className="bg-gray-100 p-3 border-b border-gray-300 flex justify-between items-center">
            <span className="font-medium">Response</span>
            <span className={`px-2 py-1 rounded text-xs ${
              result.status >= 200 && result.status < 300
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              Status: {result.status}
            </span>
          </div>
          <pre className="p-4 bg-gray-50 overflow-auto max-h-96">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
