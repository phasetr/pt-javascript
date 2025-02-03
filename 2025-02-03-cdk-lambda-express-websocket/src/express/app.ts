import { eventContext } from "aws-serverless-express/middleware";
import express, { NextFunction, type Request, Response } from "express";
import type { APIGatewayEvent } from "aws-lambda";
import { socketMiddleware } from "./socket.middleware";
const app = express();

app.use(eventContext());

// Middleware to handle WebSocket events
app.use((req, res, next) => {
	socketMiddleware(
		req as Request & {
			apiGateway?: { event?: APIGatewayEvent & { socketBody?: string } };
		},
		res,
		next,
	);
});

export default app;
