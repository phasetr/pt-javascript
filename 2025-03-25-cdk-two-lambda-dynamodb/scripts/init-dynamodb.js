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

// テーブル作成コマンド
const createTableCommand = new CreateTableCommand({
  TableName: `${prefix}-Table`,
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
      console.log(`テーブル ${prefix}-Table はすでに存在します`);
    } else {
      console.error('テーブル作成中にエラーが発生しました:', error);
    }
  }
}

createTable();
