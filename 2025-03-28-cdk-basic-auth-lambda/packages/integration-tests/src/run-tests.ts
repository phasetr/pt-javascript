#!/usr/bin/env node
import { execSync, spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';

// Get environment from command line arguments
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const env = envArg ? envArg.split('=')[1] : 'local';

// Validate environment
if (!['local', 'dev', 'prod'].includes(env)) {
  console.error(`Invalid environment: ${env}. Must be one of: local, dev, prod`);
  process.exit(1);
}

console.log(`Running integration tests in ${env} environment...`);

// ローカルサーバーのプロセス
let serverProcess: ChildProcess | null = null;

// ローカルサーバーを起動する関数
const startLocalServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('Starting local server...');
    
    // Hono APIのディレクトリパス
    const honoApiPath = '../hono-api';
    
    // サーバーを起動
    serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: honoApiPath,
      stdio: 'pipe',
      shell: true
    });
    
    // 標準出力を処理
    serverProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      console.log(`Server: ${output}`);
      
      // サーバーが起動したことを示すメッセージを検出したら解決
      if (output.includes('Starting local server on http://localhost:3000')) {
        console.log('Local server started successfully');
        
        // サーバーが完全に起動するまで少し待つ
        setTimeout(() => {
          resolve();
        }, 1000);
      }
    });
    
    // 標準エラー出力を処理
    serverProcess.stderr?.on('data', (data) => {
      console.error(`Server Error: ${data.toString()}`);
    });
    
    // エラーハンドリング
    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      reject(error);
    });
    
    // 10秒後にタイムアウト
    setTimeout(() => {
      if (serverProcess) {
        reject(new Error('Server startup timed out'));
      }
    }, 10000);
  });
};

// ローカルサーバーを停止する関数
const stopLocalServer = () => {
  if (serverProcess) {
    console.log('Stopping local server...');
    
    // プロセスを終了
    if (process.platform === 'win32') {
      // Windowsの場合はtaskkillを使用
      if (serverProcess.pid) {
        execSync(`taskkill /pid ${serverProcess.pid} /f /t`, { stdio: 'ignore' });
      }
    } else {
      // Unix系の場合はkillを使用
      if (serverProcess.pid) {
        process.kill(-serverProcess.pid, 'SIGINT');
      }
    }
    
    serverProcess = null;
    console.log('Local server stopped');
  }
};

try {
  // ローカル環境の場合はサーバーを起動
  if (env === 'local') {
    await startLocalServer();
  }
  
  // NODE_ENVを設定
  const nodeEnv = env === 'prod' ? 'production' : (env === 'dev' ? 'development' : 'test');
  
  // 環境変数を設定してテストを実行
  const envVars = {
    NODE_ENV: nodeEnv,
    TEST_ENV: env
  };
  
  // テスト実行結果を詳細に表示
  console.log("\n===== テスト実行開始 (" + env + "環境) =====\n");
  
  // テスト結果を直接表示
  console.log("\n===== テスト実行結果 =====\n");
  
  try {
    // テストを実行して結果を直接表示
    execSync("npx vitest run --reporter verbose", { 
      stdio: "inherit",
      env: { ...process.env, ...envVars }
    });
  } catch (testError) {
    console.error("\n===== テスト実行エラー =====\n");
    console.error("テスト実行中にエラーが発生しました。");
    throw testError;
  }
  
  console.log(`Integration tests completed successfully in ${env} environment.`);
} catch (error) {
  console.error(`Integration tests failed in ${env} environment.`);
  process.exit(1);
} finally {
  // ローカル環境の場合はサーバーを停止
  if (env === 'local') {
    stopLocalServer();
  }
}
