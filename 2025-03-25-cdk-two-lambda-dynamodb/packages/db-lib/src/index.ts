/**
 * DynamoDB 操作のための共有ライブラリ
 * 
 * このモジュールは、DynamoDB テーブルに対する基本的な操作を提供します。
 * Hono API と Remix アプリケーションから共通して使用されます。
 */

export const VERSION = '0.1.0';

// クライアント
export { createDynamoDBClient, createDynamoDBDocumentClient, type DynamoDBConfig } from './client.js';

// モデル
export * from './models/index.js';
export { TaskStatus } from './models/task.js';

// リポジトリ
export * from './repositories/index.js';

// テーブル定義
export * from './tables.js';

// ファクトリ関数
import { createDynamoDBDocumentClient } from './client.js';
import { UserRepository } from './repositories/user-repository.js';
import { TaskRepository } from './repositories/task-repository.js';

export interface DbFactoryConfig {
  userTableName: string;
  taskTableName: string;
  region?: string;
  endpoint?: string;
}

/**
 * DynamoDBリポジトリファクトリ
 * 
 * 各リポジトリのインスタンスを作成するファクトリ関数
 */
export function createDynamoDbRepositories(config: DbFactoryConfig) {
  const client = createDynamoDBDocumentClient({
    region: config.region,
    endpoint: config.endpoint
  });

  return {
    userRepository: new UserRepository(client, { tableName: config.userTableName }),
    taskRepository: new TaskRepository(client, { tableName: config.taskTableName })
  };
}
