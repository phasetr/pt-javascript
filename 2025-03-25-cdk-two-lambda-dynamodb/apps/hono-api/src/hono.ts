import { Hono } from "hono";
import { cors } from "hono/cors";
import { userRouter } from "./routes/users.js";
import { taskRouter } from "./routes/tasks.js";

function getNow() {
	const date = new Date();
	return date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export const app = new Hono();
app.use("*", cors());

// ルートエンドポイント
app.get("/", (c) => {
	const now = getNow();
	console.log(`${now} SERVER LOG for root '/'`);
	// 環境変数から環境情報を取得
	const environment = process.env.ENVIRONMENT || "local";
	return c.text(
		`${now} Hello Lambda in Hono! Environment: ${environment}`,
	);
});

// 環境情報を返すエンドポイント
app.get("/env", (c) => {
	const now = getNow();
	console.log(`${now} SERVER LOG for '/env'`);
	const environment = process.env.ENVIRONMENT || "local";
	return c.json({
		environment,
		timestamp: now,
		service: "Hono API",
	});
});

// APIバージョンプレフィックス
const api = new Hono();

// ユーザーとタスクのルーターをマウント
api.route("/users", userRouter);
api.route("/tasks", taskRouter);

// APIルーターをマウント
app.route("/api/v1", api);

// APIドキュメントエンドポイント
app.get("/api", (c) => {
	return c.json({
		message: "Welcome to the CTLD API",
		version: "1.0.0",
		endpoints: {
			users: "/api/v1/users",
			tasks: "/api/v1/tasks"
		}
	});
});
