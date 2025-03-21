import { createNodeWebSocket } from "@hono/node-ws";
import type { Hono } from "hono";
import { nowJst } from "./utils";

export function honoSetupWebSocket(app: Hono) {
	const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
	// http
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

	// WebSocket
	app.get(
		"/media-stream",
		upgradeWebSocket((_c) => {
			return {
				onMessage(event, ws) {
					console.log(`Message from client: ${event.data}`);
					ws.send(
						`👺Hello from Hono! Your input is "${event.data.toString()}"!`,
					);
				},
				onClose: () => {
					console.log("Connection closed");
				},
			};
		}),
	);
	return injectWebSocket;
}
