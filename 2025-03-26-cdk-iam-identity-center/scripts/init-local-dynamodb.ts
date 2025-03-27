#!/usr/bin/env ts-node
/**
 * DynamoDB Localテーブル初期化スクリプト
 * 
 * このスクリプトは、ローカル環境のDynamoDB Localにテーブルを作成します。
 * Docker Composeで起動したDynamoDB Localに接続し、必要なテーブルとインデックスを設定します。
 * 
 * 使用方法:
 *   ts-node --esm scripts/init-local-dynamodb.ts
 */

import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';

// DynamoDB Localクライアントの設定
const client = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
  region: 'ap-northeast-1',
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local'
  }
});

// テーブル名
const TABLE_NAME = 'CIIC-local-DDB';

// テーブル作成関数
const createTable = async () => {
  try {
    // 既存のテーブルを確認
    const listTablesResponse = await client.send(new ListTablesCommand({}));
    const tableExists = listTablesResponse.TableNames?.includes(TABLE_NAME);

    if (tableExists) {
      console.log(`テーブル ${TABLE_NAME} は既に存在します。`);
      return;
    }

    // テーブル作成コマンド
    const createTableCommand = new CreateTableCommand({
      TableName: TABLE_NAME,
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'entity', AttributeType: 'S' }
      ],
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'EntityIndex',
          KeySchema: [
            { AttributeName: 'entity', KeyType: 'HASH' }
          ],
          Projection: {
            ProjectionType: 'ALL'
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    });

    // テーブル作成実行
    await client.send(createTableCommand);
    console.log(`テーブル ${TABLE_NAME} を作成しました。`);
  } catch (error) {
    console.error('テーブル作成中にエラーが発生しました:', error);
    process.exit(1);
  }
};

// スクリプト実行
console.log('DynamoDB Localテーブル初期化を開始します...');
createTable().then(() => {
  console.log('DynamoDB Localテーブル初期化が完了しました。');
});
