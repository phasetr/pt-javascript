import { Hono } from "hono";
import { cors } from "hono/cors";

function getNow() {
	const date = new Date();
	return date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export const app = new Hono();
app.use("*", cors());
app.get("/", (c) => {
	const now = getNow();
	console.log(`${now} SERVER LOG for root '/'`);
	// 環境変数から環境情報を取得
	const environment = process.env.ENVIRONMENT || "local";
	return c.text(`${now} Hello Lambda in Hono! Environment: ${environment}`);
});

// 環境情報を返すエンドポイントを追加
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
