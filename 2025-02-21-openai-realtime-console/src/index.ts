import { Hono } from "hono";
import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import { fastify } from "./fastify";
import { honoSetupWebSocket } from "./honoSetupWebSocket";
import { honoWs } from "./hono";
dotenv.config();

const PORT: number = process.env.PORT
	? Number.parseInt(process.env.PORT, 10)
	: 3000;
const WAF = process.env.WAF || "hono";

if (WAF === "fastify") {
	fastify.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		console.log(`👺FASTIFY👺 Server is listening on port ${PORT}!`);
	});
} else if (WAF === "hono-simple") {
	console.log("👺HONO-SIMPLE👺");
	const app = new Hono();
	const injectWebSocket = honoSetupWebSocket(app);
	const server = serve(app);
	injectWebSocket(server);
} else {
	console.log("👺HONO👺");
	const app = new Hono();
	const injectWebSocket = honoWs(app);
	const server = serve(app);
	injectWebSocket(server);
}
