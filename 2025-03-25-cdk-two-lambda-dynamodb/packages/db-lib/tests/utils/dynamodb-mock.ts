/**
 * DynamoDBのモックユーティリティ
 * 
 * テスト用にDynamoDBクライアントをモックするためのユーティリティ関数を提供します。
 */

import { vi } from 'vitest';
import { type DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

// モックデータを保持するためのインメモリストア
export interface MockStore {
  [tableName: string]: {
    [key: string]: any;
  };
}

/**
 * DynamoDBドキュメントクライアントのモックを作成
 */
export function createMockDynamoDBDocumentClient(initialData: MockStore = {}): {
  client: DynamoDBDocumentClient;
  store: MockStore;
} {
  // インメモリストアの初期化
  const store: MockStore = { ...initialData };

  // モックの実装
  const mockSend = vi.fn().mockImplementation(async (command) => {
    // テーブル名の取得
    const tableName = command.input.TableName;
    
    // テーブルが存在しない場合は作成
    if (!store[tableName]) {
      store[tableName] = {};
    }

    // GetCommandの処理
    if (command instanceof GetCommand) {
      const pk = command.input.Key?.PK;
      const sk = command.input.Key?.SK;
      if (!pk || !sk) {
        throw new Error('PK and SK are required');
      }
      const key = `${pk}#${sk}`;
      const item = store[tableName][key];
      
      return {
        Item: item || null
      };
    }
    
    // PutCommandの処理
    if (command instanceof PutCommand) {
      const item = command.input.Item;
      if (!item) {
        throw new Error('Item is required');
      }
      const pk = item.PK;
      const sk = item.SK;
      if (!pk || !sk) {
        throw new Error('PK and SK are required');
      }
      const key = `${pk}#${sk}`;
      
      // 条件式のチェック
      if (command.input.ConditionExpression) {
        // attribute_not_exists(PK) の条件式
        if (command.input.ConditionExpression.includes('attribute_not_exists(PK)') && store[tableName][key]) {
          throw new Error('ConditionalCheckFailedException');
        }
        
        // attribute_not_exists(PK) AND attribute_not_exists(SK) の条件式
        if (command.input.ConditionExpression.includes('attribute_not_exists(PK) AND attribute_not_exists(SK)') && store[tableName][key]) {
          throw new Error('ConditionalCheckFailedException');
        }
      }
      
      store[tableName][key] = { ...item };
      return {};
    }
    
    // DeleteCommandの処理
    if (command instanceof DeleteCommand) {
      const pk = command.input.Key?.PK;
      const sk = command.input.Key?.SK;
      if (!pk || !sk) {
        throw new Error('PK and SK are required');
      }
      const key = `${pk}#${sk}`;
      
      delete store[tableName][key];
      return {};
    }
    
    // QueryCommandの処理
    if (command instanceof QueryCommand) {
      const items = [];
      const keyCondition = command.input.KeyConditionExpression;
      const expressionValues = command.input.ExpressionAttributeValues || {};
      const filterExpression = command.input.FilterExpression;
      const expressionNames = command.input.ExpressionAttributeNames || {};
      
      // 簡易的なKeyConditionExpressionの解析
      if (keyCondition) {
        // PK = :pk AND begins_with(SK, :sk_prefix) のようなパターンを処理
        if (keyCondition.includes('PK = :pk') && keyCondition.includes('begins_with(SK, :sk_prefix)')) {
          const pk = expressionValues[':pk'];
          const skPrefix = expressionValues[':sk_prefix'];
          
          for (const key in store[tableName]) {
            const item = store[tableName][key];
            if (item.PK === pk && item.SK.startsWith(skPrefix)) {
              // フィルター式の処理
              if (filterExpression) {
                // 簡易的なフィルター処理（#status = :status のようなパターン）
                if (filterExpression.includes('#status = :status')) {
                  const statusField = expressionNames['#status'];
                  const statusValue = expressionValues[':status'];
                  
                  if (item[statusField] === statusValue) {
                    items.push(item);
                  }
                }
              } else {
                items.push(item);
              }
            }
          }
        }
        // email = :email のようなパターンを処理（GSIクエリ）
        else if (keyCondition.includes('email = :email')) {
          const email = expressionValues[':email'];
          
          for (const key in store[tableName]) {
            const item = store[tableName][key];
            if (item.email === email) {
              items.push(item);
            }
          }
        }
      }
      
      return {
        Items: items
      };
    }
    
    // 未実装のコマンド
    throw new Error(`Unimplemented command: ${command.constructor.name}`);
  });

  // モックDynamoDBドキュメントクライアントの作成
  const mockClient = {
    send: mockSend
  } as unknown as DynamoDBDocumentClient;

  return {
    client: mockClient,
    store
  };
}
