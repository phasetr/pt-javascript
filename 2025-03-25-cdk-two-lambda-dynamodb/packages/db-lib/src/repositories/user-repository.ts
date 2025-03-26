/**
 * ユーザーリポジトリ
 * 
 * DynamoDBのユーザーテーブルに対する操作を提供します。
 */

import { type DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { type User, createUserPK, USER_SK, createUser, updateUser, USER_ENTITY } from '../models/user';

export interface UserRepositoryConfig {
  tableName: string;
}

export class UserRepository {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(client: DynamoDBDocumentClient, config: UserRepositoryConfig) {
    this.client = client;
    this.tableName = config.tableName;
  }

  /**
   * ユーザーを取得
   */
  async getUser(id: string): Promise<User | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: createUserPK(id),
        SK: USER_SK
      }
    });

    const response = await this.client.send(command);
    return response.Item as User | null;
  }

  /**
   * ユーザーを作成
   */
  async createUser(user: User | {
    id: string;
    email: string;
    name: string;
  }): Promise<User> {
    // ユーザーオブジェクトを作成
    const userItem = 'PK' in user ? user : createUser(user);
    
    const command = new PutCommand({
      TableName: this.tableName,
      Item: userItem,
      ConditionExpression: 'attribute_not_exists(PK)'
    });

    await this.client.send(command);
    return userItem;
  }

  /**
   * ユーザーを更新
   */
  async updateUser(id: string, updates: Partial<Omit<User, 'PK' | 'SK' | 'id' | 'entity' | 'createdAt'>>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User not found: ${id}`);
    }

    const updatedUser = updateUser(user, updates);
    
    const command = new PutCommand({
      TableName: this.tableName,
      Item: updatedUser
    });

    await this.client.send(command);
    return updatedUser;
  }

  /**
   * ユーザーを削除
   */
  async deleteUser(id: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        PK: createUserPK(id),
        SK: USER_SK
      }
    });

    await this.client.send(command);
  }

  /**
   * メールアドレスでユーザーを検索
   * 
   * 注: このメソッドはGSIを使用することを想定しています。
   * 実際の実装ではGSIの設定が必要です。
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    });

    const response = await this.client.send(command);
    if (!response.Items || response.Items.length === 0) {
      return null;
    }

    return response.Items[0] as User;
  }

  /**
   * 全てのユーザーを取得
   * 
   * 注: このメソッドはGSI（EntityIndex）を使用して、entityがUSERのアイテムを取得します。
   * 
   * @param limit 取得する最大件数（デフォルト: 100）
   * @param lastEvaluatedKey 前回のレスポンスから取得した続きのキー
   * @returns ユーザーの配列と続きのキー
   */
  async listAllUsers(limit: number = 100, lastEvaluatedKey?: Record<string, unknown>): Promise<{
    users: User[];
    lastEvaluatedKey?: Record<string, unknown>;
  }> {
    // デバッグ情報を出力
    console.log(`Querying EntityIndex with entity=${USER_ENTITY} and limit: ${limit}`);
    console.log(`Last evaluated key: ${JSON.stringify(lastEvaluatedKey)}`);
    
    // クエリコマンドを作成
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'EntityIndex',
      KeyConditionExpression: 'entity = :entity',
      ExpressionAttributeValues: {
        ':entity': USER_ENTITY
      },
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey
    });

    // クエリを実行
    const response = await this.client.send(command);
    
    // デバッグ情報を出力
    console.log(`Found ${response.Items?.length || 0} items`);
    console.log(`Last evaluated key: ${JSON.stringify(response.LastEvaluatedKey)}`);
    
    // 結果を返す
    return {
      users: (response.Items || []) as User[],
      lastEvaluatedKey: response.LastEvaluatedKey
    };
  }
}
