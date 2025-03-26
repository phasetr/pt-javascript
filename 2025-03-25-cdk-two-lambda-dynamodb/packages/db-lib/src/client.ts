/**
 * DynamoDBクライアント
 * 
 * DynamoDBへの接続とテーブル操作を行うクライアントを提供します。
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export interface DynamoDBConfig {
  region?: string;
  endpoint?: string;
}

/**
 * DynamoDBクライアントを作成
 */
export function createDynamoDBClient(config: DynamoDBConfig = {}): DynamoDBClient {
  return new DynamoDBClient({
    region: config.region || 'ap-northeast-1',
    endpoint: config.endpoint,
  });
}

/**
 * DynamoDBドキュメントクライアントを作成
 * 
 * ドキュメントクライアントは、JavaScriptオブジェクトとDynamoDBの属性値マップの
 * 変換を自動的に行います。
 */
export function createDynamoDBDocumentClient(config: DynamoDBConfig = {}): DynamoDBDocumentClient {
  const client = createDynamoDBClient(config);
  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });
}
