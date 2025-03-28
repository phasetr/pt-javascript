import { Hono } from "hono";
import { logger } from "hono/logger";
import { basicAuth } from "hono/basic-auth";
import { todos } from "./todos.js";

const app = new Hono();

// ログの設定
app.use("*", logger());
//Basic認証の設定
app.use(
	"*",
	basicAuth({
		// ローカル環境では固定でdummy/dummyを使用
		// それ以外の環境では環境変数から取得
		username: process.env.ENV === 'local' ? 'dummy' : (process.env.BASIC_USERNAME || 'dummy'),
		password: process.env.ENV === 'local' ? 'dummy' : (process.env.BASIC_PASSWORD || 'dummy'),
	}),
);

app.get("/", (c) => {
	return c.text("Hello Hono!");
});
app.route("/api/todos", todos);

export default app;
