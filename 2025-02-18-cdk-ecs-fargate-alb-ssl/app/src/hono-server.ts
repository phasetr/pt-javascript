import { Hono } from "hono";
import { nowJst } from "./utils.js";

export const app = new Hono();

app.get("/", async (c) => {
	try {
		// すぐ確認できるように削除ではなくコメントアウト
		// const { OPENAI_API_KEY, SERVICE_URL } = await getAllSecretValues(
		// 	process.env,
		// );
		const jst = nowJst();
		console.log(`現在の日本時刻: ${jst}`);
		return c.text(`Hello, hono: ${jst}`);
	} catch (e) {
		console.log(e);
		return c.text("We have some errors!");
	}
});
