import { eq } from "drizzle-orm";
import { numbers } from "../db/schema.js";
import type { Database } from "../db/types.js";
import type { NumbersInsert, NumbersSelect } from "./types.js";

/**
 * 全件取得
 * @param db データベースインスタンス
 * @returns Numbers配列
 */
export async function findAllNumbers(db: Database): Promise<NumbersSelect[]> {
	return await db.select().from(numbers).all();
}

/**
 * ID指定で1件取得
 * @param db データベースインスタンス
 * @param id 取得対象ID
 * @returns Numbersまたはundefined
 */
export async function findNumberById(
	db: Database,
	id: number,
): Promise<NumbersSelect> {
	try {
		const result = await db
			.select()
			.from(numbers)
			.where(eq(numbers.id, id))
			.limit(1);
		if (result.length === 0) {
			throw new Error(`Number with id ${id} not found`);
		}
		return result[0];
	} catch (error) {
		throw new Error(`Failed to find number with id ${id}: ${error}`);
	}
}

/**
 * 新規作成
 * @param db データベースインスタンス
 * @param data 作成データ
 * @returns 作成されたNumbers
 */
export async function createNumber(
	db: Database,
	data: Omit<NumbersInsert, "id" | "createdAt" | "updatedAt">,
): Promise<NumbersSelect> {
	try {
		const result = await db.insert(numbers).values(data).returning();
		return result[0];
	} catch (error) {
		throw new Error(`Failed to create number: ${error}`);
	}
}

/**
 * 更新
 * @param db データベースインスタンス
 * @param id 更新対象ID
 * @param data 更新データ
 * @returns 更新されたNumbers
 * @throws Error 対象IDが存在しない場合
 */
export async function updateNumber(
	db: Database,
	id: number,
	data: Partial<Omit<NumbersInsert, "id" | "createdAt" | "updatedAt">>,
): Promise<void> {
	try {
		await db
			.update(numbers)
			.set({
				...data,
				updatedAt: new Date().toISOString(),
			})
			.where(eq(numbers.id, id));
		const result = await db.select().from(numbers).where(eq(numbers.id, id));
		if (!result[0]) {
			throw new Error(`Number with id ${id} not found`);
		}
	} catch (error) {
		throw new Error(`Failed to update number with id ${id}: ${error}`);
	}
}

/**
 * 削除
 * @param db データベースインスタンス
 * @param id 削除対象ID
 * @returns 削除成功したかどうか
 */
export async function deleteNumber(db: Database, id: number): Promise<boolean> {
	try {
		const result = await db
			.delete(numbers)
			.where(eq(numbers.id, id))
			.returning();
		return result.length > 0;
	} catch (error) {
		throw new Error(`Failed to delete number with id ${id}: ${error}`);
	}
}
