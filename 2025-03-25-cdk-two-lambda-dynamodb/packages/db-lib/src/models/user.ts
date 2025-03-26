/**
 * ユーザーモデル
 * 
 * DynamoDBのユーザーテーブルに対応するモデル定義
 */

export interface User {
  PK: string; // パーティションキー: USER#<userId>
  SK: string; // ソートキー: PROFILE
  userId: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * ユーザーIDからパーティションキーを生成
 */
export function createUserPK(userId: string): string {
  return `USER#${userId}`;
}

/**
 * ユーザープロファイルのソートキー
 */
export const USER_SK = 'PROFILE';

/**
 * ユーザーオブジェクトを作成
 */
export function createUser(params: {
  userId: string;
  email: string;
  name: string;
}): User {
  const now = new Date().toISOString();
  
  return {
    PK: createUserPK(params.userId),
    SK: USER_SK,
    userId: params.userId,
    email: params.email,
    name: params.name,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * ユーザーオブジェクトを更新
 */
export function updateUser(user: User, updates: Partial<Omit<User, 'PK' | 'SK' | 'userId' | 'createdAt'>>): User {
  // 現在時刻を取得（テスト用に引数で渡せるようにする）
  const now = new Date().toISOString();
  
  return {
    ...user,
    ...updates,
    updatedAt: now
  };
}
