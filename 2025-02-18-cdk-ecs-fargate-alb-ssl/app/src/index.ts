import { serve } from "@hono/node-server";
import { honoSimple } from "./hono-simple-server.js";
import { fastify } from "./fastify-server.js";
import { startServer } from "./hono-server.js";

const PORT: number = process.env.PORT
	? Number.parseInt(process.env.PORT, 10)
	: 3000;
const WAF: string = process.env.WAF ? process.env.WAF : "fastify";

if (WAF === "hono-simple") {
	console.log(`Server is running on http://localhost:${PORT} by Hono Simple`);
	serve({
		fetch: honoSimple.fetch,
		port: PORT,
	});
} else if (WAF === "fastify") {
	console.log(`Server is running on http://localhost:${PORT} by Fastify`);
	fastify.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		console.log(
			`Server is listening on port ${PORT} by fastify in fastify.listen!`,
		);
	});
} else {
	console.log(`Server is running on http://localhost:${PORT} by Hono`);
	// Honoサーバーを起動し、WebSocketサーバーもセットアップする
	startServer(PORT);
}
