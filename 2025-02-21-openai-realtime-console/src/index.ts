import dotenv from "dotenv";
import { fastify } from "./fastify";
dotenv.config();

const PORT: number = process.env.PORT
	? Number.parseInt(process.env.PORT, 10)
	: 3000;
const WAF = process.env.WAF || "fastify";

if (WAF === "fastify") {
	fastify.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		console.log(`👺FASTIFY👺 Server is listening on port ${PORT}!`);
	});
}
