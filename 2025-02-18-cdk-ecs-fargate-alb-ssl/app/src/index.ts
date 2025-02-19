import { serve } from "@hono/node-server";
import { app } from "./hono-server.js";
import { fastify } from "./fastify-server.js";

const PORT: number = process.env.PORT
	? Number.parseInt(process.env.PORT, 10)
	: 3000;
const WAF: string = process.env.WAF ? process.env.WAF : "fastify";

if (WAF === "hono") {
	console.log(`Server is running on http://localhost:${PORT} by Hono`);
	serve({
		fetch: app.fetch,
		port: PORT,
	});
} else {
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
}
