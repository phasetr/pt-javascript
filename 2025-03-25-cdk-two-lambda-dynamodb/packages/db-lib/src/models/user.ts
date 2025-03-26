/**
 * ユーザーモデル
 *
 * DynamoDBのユーザーテーブルに対応するモデル定義
 */

export interface User {
  PK: string; // パーティションキー: USER#<id>
  SK: string; // ソートキー: PROFILE
  id: string;
  email: string;
  name: string;
  entity: string; // エンティティ種別: USER
  createdAt: string;
  updatedAt: string;
}

// エンティティ種別
export const USER_ENTITY = "USER";

/**
 * ユーザーIDからパーティションキーを生成
 */
export function createUserPK(id: string): string {
  return `USER#${id}`;
}

/**
 * ユーザープロファイルのソートキー
 */
export const USER_SK = "PROFILE";

/**
 * ユーザーオブジェクトを作成
 */
export function createUser(params: {
  id: string;
  email: string;
  name: string;
}): User {
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

/**
 * ユーザーオブジェクトを更新
 */
export function updateUser(
	user: User,
	updates: Partial<Omit<User, "PK" | "SK" | "id" | "entity" | "createdAt">>,
): User {
	// 現在時刻を取得（テスト用に引数で渡せるようにする）
	const now = new Date().toISOString();

	return {
		...user,
		...updates,
		updatedAt: now,
	};
}
