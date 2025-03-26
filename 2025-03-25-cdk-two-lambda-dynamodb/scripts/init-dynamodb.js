#!/usr/bin/env node
const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

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
// 環境名（デフォルトはlocal）
const env = process.env.ENV || 'local';
// リソース名のプレフィックス
const resourcePrefix = `${prefix}-${env}`;

// テーブル定義（シングルテーブル設計）
const tables = [
  // 単一テーブル（ユーザーとタスクの両方を格納）
  {
    TableName: `${resourcePrefix}-DDB`,
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
      { AttributeName: 'email', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'EmailIndex',
        KeySchema: [
          { AttributeName: 'email', KeyType: 'HASH' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
      {
        IndexName: 'StatusIndex',
        KeySchema: [
          { AttributeName: 'PK', KeyType: 'HASH' },
          { AttributeName: 'status', KeyType: 'RANGE' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    BillingMode: 'PROVISIONED',
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  },
];

// テーブル作成の実行
async function createTables() {
  try {
    // 既存のテーブル一覧を取得
    const listTablesResponse = await client.send(new ListTablesCommand({}));
    const existingTables = listTablesResponse.TableNames || [];

    // 各テーブルを作成
    for (const tableDefinition of tables) {
      const tableName = tableDefinition.TableName;

      // テーブルが既に存在するかチェック
      if (existingTables.includes(tableName)) {
        console.log(`テーブル ${tableName} は既に存在します`);
        continue;
      }

      // テーブル作成コマンドを実行
      const createTableCommand = new CreateTableCommand(tableDefinition);
      const response = await client.send(createTableCommand);
      console.log(`テーブル ${tableName} が正常に作成されました:`, response.TableDescription.TableStatus);
    }

    console.log('すべてのテーブルの作成が完了しました');
  } catch (error) {
    console.error('テーブル作成中にエラーが発生しました:', error);
  }
}

createTables();
