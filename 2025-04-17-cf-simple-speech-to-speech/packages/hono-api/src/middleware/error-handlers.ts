/**
 * エラーハンドラーミドルウェア
 */
import type { Context } from "hono";

/**
 * 404ハンドラー
 * 存在しないエンドポイントへのリクエストに対するレスポンスを返します
 */
export const notFoundHandler = (c: Context) => {
	return c.json(
		{ error: "Not Found", message: "The requested endpoint does not exist" },
		404,
	);
};

/**
 * エラーハンドラー
 * 未処理のエラーに対するレスポンスを返します
 */
export const errorHandler = (err: Error, c: Context) => {
	console.error("Unhandled error:", err);
	return c.json({ error: "Internal Server Error", message: err.message }, 500);
};
