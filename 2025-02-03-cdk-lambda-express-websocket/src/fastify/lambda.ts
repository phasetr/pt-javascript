import awsLambdaFastify from "@fastify/aws-lambda";
import type { Handler } from "aws-lambda";
import app from "./app";

// Fastify インスタンスから Lambda ハンドラーを生成します
const proxy = awsLambdaFastify(app);

export const handler: Handler = async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false;
	event.socketBody = event.body;
	return proxy(event, context);
};
