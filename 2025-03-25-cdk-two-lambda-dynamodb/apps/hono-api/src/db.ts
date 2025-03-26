/**
 * DynamoDBリポジトリの初期化
 * 
 * db-libを使用してDynamoDBリポジトリを初期化します。
 */

import { createDynamoDbRepositories, type DbFactoryConfig } from '@ctld/db-lib';

// 環境変数からテーブル名を取得
const environment = process.env.ENVIRONMENT || 'local';
const userTableName = process.env.USER_TABLE_NAME || `CTLD-${environment}-DDB`;
const taskTableName = process.env.TASK_TABLE_NAME || `CTLD-${environment}-DDB`;

// ローカル環境の場合はエンドポイントを設定
const endpoint = environment === 'local' ? 'http://localhost:8000' : undefined;

// DynamoDBリポジトリの設定
const dbConfig: DbFactoryConfig = {
  userTableName,
  taskTableName,
  region: process.env.AWS_REGION || 'ap-northeast-1',
  endpoint
};

// DynamoDBリポジトリの初期化
export const { userRepository, taskRepository } = createDynamoDbRepositories(dbConfig);

// 初期化ログ
console.log(`DynamoDB repositories initialized for environment: ${environment}`);
console.log(`User table: ${userTableName}`);
console.log(`Task table: ${taskTableName}`);
console.log(`Endpoint: ${endpoint || 'AWS Default'}`);
