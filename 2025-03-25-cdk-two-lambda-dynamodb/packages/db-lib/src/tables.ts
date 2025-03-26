/**
 * DynamoDBテーブル定義
 * 
 * CDKでDynamoDBテーブルを作成するための定義を提供します。
 */

export interface TableDefinition {
  tableName: string;
  partitionKey: string;
  sortKey?: string;
  globalSecondaryIndexes?: GlobalSecondaryIndexDefinition[];
  localSecondaryIndexes?: LocalSecondaryIndexDefinition[];
  billingMode?: 'PROVISIONED' | 'PAY_PER_REQUEST';
  readCapacity?: number;
  writeCapacity?: number;
  timeToLiveAttribute?: string;
  pointInTimeRecovery?: boolean;
}

export interface GlobalSecondaryIndexDefinition {
  indexName: string;
  partitionKey: string;
  sortKey?: string;
  projectionType?: 'ALL' | 'KEYS_ONLY' | 'INCLUDE';
  nonKeyAttributes?: string[];
  readCapacity?: number;
  writeCapacity?: number;
}

export interface LocalSecondaryIndexDefinition {
  indexName: string;
  sortKey: string;
  projectionType?: 'ALL' | 'KEYS_ONLY' | 'INCLUDE';
  nonKeyAttributes?: string[];
}

/**
 * ユーザーテーブル定義
 */
export const userTableDefinition: TableDefinition = {
  tableName: 'Users',
  partitionKey: 'PK',
  sortKey: 'SK',
  globalSecondaryIndexes: [
    {
      indexName: 'EmailIndex',
      partitionKey: 'email',
      projectionType: 'ALL'
    }
  ],
  billingMode: 'PAY_PER_REQUEST',
  pointInTimeRecovery: true
};

/**
 * タスクテーブル定義
 */
export const taskTableDefinition: TableDefinition = {
  tableName: 'Tasks',
  partitionKey: 'PK',
  sortKey: 'SK',
  globalSecondaryIndexes: [
    {
      indexName: 'StatusIndex',
      partitionKey: 'PK',
      sortKey: 'status',
      projectionType: 'ALL'
    }
  ],
  billingMode: 'PAY_PER_REQUEST',
  pointInTimeRecovery: true
};

/**
 * テーブル名を環境に応じて生成
 */
export function getTableName(baseName: string, env: string): string {
  return `CTLD-${env}-${baseName}`;
}
