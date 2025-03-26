#!/usr/bin/env node
const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

// DynamoDBクライアントの設定
const client = new DynamoDBClient({
  region: 'ap-northeast-1',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy',
  },
});

// プロジェクトの略称をプレフィックスとして使用
const prefix = 'CTLD';
// 環境名をリソース名に含める
const resourcePrefix = `${prefix}-dev`;

// テーブル作成コマンド
const createTableCommand = new CreateTableCommand({
  TableName: `${resourcePrefix}-Table`,
  KeySchema: [
    { AttributeName: 'PK', KeyType: 'HASH' },
    { AttributeName: 'SK', KeyType: 'RANGE' },
  ],
  AttributeDefinitions: [
    { AttributeName: 'PK', AttributeType: 'S' },
    { AttributeName: 'SK', AttributeType: 'S' },
  ],
  BillingMode: 'PAY_PER_REQUEST',
});

// テーブル作成の実行
async function createTable() {
  try {
    const response = await client.send(createTableCommand);
    console.log('テーブルが正常に作成されました:', response);
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`テーブル${resourcePrefix}-Tableはすでに存在します`);
    } else {
      console.error(`テーブル${resourcePrefix}-Table作成中にエラーが発生しました:`, error);
    }
  }
}

createTable();
