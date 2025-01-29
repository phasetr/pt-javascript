import fastify from "fastify";
import type { FastifyRequest, FastifyReply } from "fastify";
import awsLambdaFastify from "@fastify/aws-lambda";

const app = fastify();
app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
	return { hello: "world" };
});

const proxy = awsLambdaFastify(app);
export const handler = proxy;
