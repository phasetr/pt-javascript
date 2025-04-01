/**
 * WebSocketサーバーの動作をテストするスクリプト
 * 
 * 使用方法:
 * node test-websocket.js
 */

const WebSocket = require('ws');

// WebSocketサーバーのURL
// ローカル環境用
// const WS_URL = 'ws://localhost:8787/ws';
// デプロイ環境用
const WS_URL = 'wss://cf-ws-hono.dev-a42.workers.dev/ws';

// 接続タイムアウト（ミリ秒）
const CONNECTION_TIMEOUT = 5000;

// テストメッセージ
const TEST_MESSAGE = {
  type: 'test',
  message: 'これはテストメッセージです',
  timestamp: new Date().toISOString()
};

// WebSocket接続をテスト
async function testWebSocketConnection() {
  console.log('=== WebSocket接続テスト ===');
  console.log(`接続先: ${WS_URL}`);
  
  return new Promise((resolve, reject) => {
    // タイムアウトタイマー
    const timeoutId = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.terminate();
        reject(new Error('接続タイムアウト'));
      }
    }, CONNECTION_TIMEOUT);
    
    // WebSocket接続を作成
    const ws = new WebSocket(WS_URL);
    
    // 接続が開いたときのイベントハンドラ
    ws.on('open', () => {
      console.log('✅ 接続成功');
      clearTimeout(timeoutId);
      
      // 接続成功後、メッセージ送受信テストに進む
      testMessageExchange(ws)
        .then(() => resolve(true))
        .catch(error => {
          ws.terminate();
          reject(error);
        });
    });
    
    // エラーが発生したときのイベントハンドラ
    ws.on('error', (error) => {
      console.error(`❌ 接続エラー: ${error.message}`);
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}

// メッセージの送受信をテスト
async function testMessageExchange(ws) {
  console.log('\n=== メッセージ送受信テスト ===');
  
  return new Promise((resolve, reject) => {
    // レスポンスタイムアウト
    const timeoutId = setTimeout(() => {
      reject(new Error('レスポンスタイムアウト'));
    }, CONNECTION_TIMEOUT);
    
    // メッセージを受信したときのイベントハンドラ
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('受信メッセージ:', message);
        
        // 接続確認メッセージの場合
        if (message.type === 'connected') {
          console.log('✅ 接続確認メッセージを受信');
          
          // テストメッセージを送信
          console.log('送信メッセージ:', TEST_MESSAGE);
          ws.send(JSON.stringify(TEST_MESSAGE));
        }
        // エコーレスポンスの場合
        else if (message.type === 'echo') {
          console.log('✅ エコーレスポンスを受信');
          
          // 受信したメッセージが元のメッセージを含んでいるか確認
          if (message.originalData && message.originalData.type === TEST_MESSAGE.type) {
            console.log('✅ 元のメッセージが正しく返されました');
            
            // テスト成功
            clearTimeout(timeoutId);
            
            // 接続を閉じる
            ws.close();
            resolve(true);
          } else {
            reject(new Error('受信したメッセージが元のメッセージと一致しません'));
          }
        }
        // エラーメッセージの場合
        else if (message.type === 'error') {
          reject(new Error(`サーバーエラー: ${message.message}`));
        }
      } catch (error) {
        reject(new Error(`メッセージの解析エラー: ${error.message}`));
      }
    });
    
    // 接続が閉じたときのイベントハンドラ
    ws.on('close', () => {
      console.log('接続が閉じられました');
    });
  });
}

// メイン関数
async function main() {
  try {
    await testWebSocketConnection();
    console.log('\n✅ すべてのテストが成功しました');
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ テスト失敗: ${error.message}`);
    process.exit(1);
  }
}

// スクリプトの実行
main();
