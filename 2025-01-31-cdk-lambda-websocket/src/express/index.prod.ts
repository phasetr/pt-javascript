import * as awsServerlessExpress from "aws-serverless-express";
import type { Handler } from "aws-lambda";
import app from "./app";

const server = awsServerlessExpress.createServer(app);

export const handler: Handler = (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false;
	event.socketBody = event.body; // Storing socket body for later use
	return awsServerlessExpress.proxy(server, event, context, "PROMISE").promise;
};
