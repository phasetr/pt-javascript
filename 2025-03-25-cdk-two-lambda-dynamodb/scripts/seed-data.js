#!/usr/bin/env node
/**
 * テストデータ生成スクリプト
 * 
 * ローカルDynamoDBにテストデータを登録します。
 * - ユーザー: 10名
 * - タスク: 全ユーザー合計で1000件（ユーザーごとに異なる数）
 * 
 * 注意: ユーザーとタスクのデータは同一のテーブル（CTLD-dev-Data）に保存されます。
 * これはシングルテーブル設計に基づいています。
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { faker } = require('@faker-js/faker');

// DynamoDBクライアントの設定
const client = new DynamoDBClient({
  region: 'ap-northeast-1',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy',
  },
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

// プロジェクトの略称をプレフィックスとして使用
const prefix = 'CTLD';
// 環境名（デフォルトはdev）
const env = process.env.ENV || 'local';
// リソース名のプレフィックス
const resourcePrefix = `${prefix}-${env}`;

// テーブル名（シングルテーブル設計）
const tableName = `${resourcePrefix}-DDB`;

// タスクステータス
const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];

// ユーザーモデル関連の関数
function createUserPK(userId) {
  return `USER#${userId}`;
}

const USER_SK = 'PROFILE';
const USER_ENTITY = 'USER';

function createUser(params) {
  const now = new Date().toISOString();

  return {
    PK: createUserPK(params.id),
    SK: USER_SK,
    id: params.id,
    email: params.email,
    name: params.name,
    entity: USER_ENTITY,
    createdAt: now,
    updatedAt: now
  };
}

// タスクモデル関連の関数
function createTaskPK(userId) {
  return `USER#${userId}`;
}

function createTaskSK(taskId) {
  return `TASK#${taskId}`;
}

const TASK_ENTITY = 'TASK';

function createTask(params) {
  const now = new Date().toISOString();

  return {
    PK: createTaskPK(params.userId),
    SK: createTaskSK(params.id),
    userId: params.userId,
    id: params.id,
    title: params.title,
    description: params.description,
    status: params.status || 'TODO',
    dueDate: params.dueDate,
    entity: TASK_ENTITY,
    createdAt: now,
    updatedAt: now
  };
}

// ユーザーリポジトリ
class UserRepository {
  constructor(client, tableName) {
    this.client = client;
    this.tableName = tableName;
  }

  async createUser(params) {
    const user = createUser(params);

    const { PutCommand } = require('@aws-sdk/lib-dynamodb');
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: user
    }));

    return user;
  }
}

// タスクリポジトリ
class TaskRepository {
  constructor(client, tableName) {
    this.client = client;
    this.tableName = tableName;
  }

  async createTask(params) {
    const task = createTask(params);

    const { PutCommand } = require('@aws-sdk/lib-dynamodb');
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: task
    }));

    return task;
  }
}

// リポジトリのインスタンス作成
const userRepo = new UserRepository(docClient, tableName);
const taskRepo = new TaskRepository(docClient, tableName);

// テストデータ生成
async function generateTestData() {
  try {
    console.log('テストデータの生成を開始します...');

    // 10名のユーザーを作成
    const userCount = 10;
    const users = [];

    console.log(`${userCount}名のユーザーを作成します...`);

    for (let i = 0; i < userCount; i++) {
      const id = uuidv4();
      const user = await userRepo.createUser({
        id,
        email: faker.internet.email(),
        name: faker.person.fullName(),
      });

      users.push(user);
      console.log(`ユーザー作成: ${user.name} (${user.id})`);
    }

    // 合計1000件のタスクを作成（ユーザーごとに異なる数）
    const totalTaskCount = 1000;

    // ユーザーごとのタスク数を決定（合計が1000になるように）
    const taskDistribution = distributeTasksAmongUsers(users.length, totalTaskCount);

    console.log(`合計${totalTaskCount}件のタスクを作成します...`);

    let taskCounter = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const userTaskCount = taskDistribution[i];

      console.log(`ユーザー ${user.name} に ${userTaskCount} 件のタスクを作成します...`);

      for (let j = 0; j < userTaskCount; j++) {
        const id = uuidv4();
        const dueDate = faker.date.future().toISOString();
        const status = TASK_STATUSES[Math.floor(Math.random() * TASK_STATUSES.length)];

        await taskRepo.createTask({
          userId: user.id,
          id,
          title: faker.lorem.sentence(3),
          description: faker.lorem.paragraph(),
          dueDate,
          status,
        });

        taskCounter++;

        if (taskCounter % 100 === 0) {
          console.log(`${taskCounter}件のタスクを作成しました...`);
        }
      }
    }

    console.log(`テストデータの生成が完了しました: ${users.length}名のユーザー、${taskCounter}件のタスク`);

    // ユーザーごとのタスク数を表示
    console.log('\nユーザーごとのタスク数:');
    for (let i = 0; i < users.length; i++) {
      console.log(`${users[i].name}: ${taskDistribution[i]}件`);
    }

  } catch (error) {
    console.error('テストデータ生成中にエラーが発生しました:', error);
  }
}

// ユーザーごとのタスク数を決定する関数
function distributeTasksAmongUsers(userCount, totalTasks) {
  // 各ユーザーに少なくとも10件のタスクを割り当て
  const minTasksPerUser = 10;
  const baseTasksTotal = userCount * minTasksPerUser;
  const remainingTasks = totalTasks - baseTasksTotal;

  // 残りのタスクをランダムに分配
  const distribution = Array(userCount).fill(minTasksPerUser);

  // 残りのタスクを分配するための重み付け
  const weights = Array(userCount).fill(0).map(() => Math.random());
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  // 重みに基づいて残りのタスクを分配
  let tasksLeft = remainingTasks;

  for (let i = 0; i < userCount - 1; i++) {
    const share = Math.floor(remainingTasks * (weights[i] / totalWeight));
    distribution[i] += share;
    tasksLeft -= share;
  }

  // 最後のユーザーに残りのタスクを割り当て
  distribution[userCount - 1] += tasksLeft;

  return distribution;
}

// メイン処理
generateTestData();
