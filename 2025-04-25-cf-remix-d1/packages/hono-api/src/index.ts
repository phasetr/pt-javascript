import { customers as customersTable } from "db";
import type { D1Database } from "db";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { cors } from "hono/cors";

// Cloudflare Workersのバインディング型定義
type CloudflareBindings = {
	DB: D1Database;
};

// D1Databaseからdrizzleクライアントを作成する関数
function createDb(d1: D1Database) {
	return drizzle(d1);
}

const app = new Hono<{ Bindings: CloudflareBindings }>();

// CORSミドルウェアを追加
app.use("*", cors());

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

// Customersの一覧を取得するエンドポイント
app.get("/api/customers", async (c) => {
	try {
		const { DB } = c.env;
		const db = createDb(DB);

		// customersテーブルから全データを取得
		const customers = await db
			.select()
			.from(customersTable)
			.orderBy(customersTable.CustomerId);

		return c.json({ customers });
	} catch (error) {
		console.error("Error fetching customers:", error);
		// より詳細なエラーメッセージを出力
		const errorMessage = error instanceof Error ? error.message : String(error);
		return c.json(
			{
				error: "Failed to fetch customers",
				details: errorMessage,
				stack: error instanceof Error ? error.stack : undefined,
			},
			500,
		);
	}
});

export default app;
