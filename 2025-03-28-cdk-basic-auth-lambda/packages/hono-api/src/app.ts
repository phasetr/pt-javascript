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
		username: process.env.BASIC_USERNAME ? process.env.BASIC_USERNAME : "dummy",
		password: process.env.BASIC_PASSWORD ? process.env.BASIC_PASSWORD : "dummy",
	}),
);

app.get("/", (c) => {
	return c.text("Hello Hono!");
});
app.route("/api/todos", todos);

export default app;
