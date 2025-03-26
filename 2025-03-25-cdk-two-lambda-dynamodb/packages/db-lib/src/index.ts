/**
 * DynamoDB 操作のための共有ライブラリ
 * 
 * このモジュールは、DynamoDB テーブルに対する基本的な操作を提供します。
 * Hono API と Remix アプリケーションから共通して使用されます。
 */

export const VERSION = '0.1.0';

// クライアント
export * from './client';

// モデル
export * from './models';

// リポジトリ
export * from './repositories';

// テーブル定義
export * from './tables';

// ファクトリ関数
import { createDynamoDBDocumentClient } from './client';
import { UserRepository } from './repositories/user-repository';
import { TaskRepository } from './repositories/task-repository';

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
