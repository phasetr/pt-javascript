/**
 * ユーザーリポジトリ
 * 
 * DynamoDBのユーザーテーブルに対する操作を提供します。
 */

import { type DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { type User, createUserPK, USER_SK, createUser, updateUser } from '../models/user';

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
  async getUser(userId: string): Promise<User | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: createUserPK(userId),
        SK: USER_SK
      }
    });

    const response = await this.client.send(command);
    return response.Item as User | null;
  }

  /**
   * ユーザーを作成
   */
  async createUser(params: {
    userId: string;
    email: string;
    name: string;
  }): Promise<User> {
    const user = createUser(params);
    
    const command = new PutCommand({
      TableName: this.tableName,
      Item: user,
      ConditionExpression: 'attribute_not_exists(PK)'
    });

    await this.client.send(command);
    return user;
  }

  /**
   * ユーザーを更新
   */
  async updateUser(userId: string, updates: Partial<Omit<User, 'PK' | 'SK' | 'userId' | 'createdAt'>>): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
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
  async deleteUser(userId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        PK: createUserPK(userId),
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
}
