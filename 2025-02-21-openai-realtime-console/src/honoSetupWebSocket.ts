import { createNodeWebSocket } from "@hono/node-ws";
import type { Hono } from "hono";

export function honoSetupWebSocket(app: Hono) {
	const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
	app.get(
		"/",
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
