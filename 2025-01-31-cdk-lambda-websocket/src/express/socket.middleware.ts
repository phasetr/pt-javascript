import type { Request, Response, NextFunction } from "express";
import type { APIGatewayEvent } from "aws-lambda";
import {
	ApiGatewayManagementApiClient,
	PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { nowJst } from "../utils";

export const socketMiddleware = async (
	req: Request & {
		apiGateway?: { event?: APIGatewayEvent & { socketBody?: string } };
	},
	res: Response,
	next: NextFunction,
) => {
	const apiGateway = req.apiGateway;

	if (apiGateway?.event) {
		const event = apiGateway?.event;
		const routeKey = event?.requestContext?.routeKey;
		const connectionId = event?.requestContext?.connectionId;

		switch (routeKey) {
			case "$connect":
				console.log(nowJst(), "connect", connectionId);
				res.status(200).json({ message: `Connected - ${connectionId}` });
				break;

			case "$disconnect":
				console.log(nowJst(), "disconnect", connectionId);
				res.status(200).json({ message: `Disconnected - ${connectionId}` });
				break;

			case "$default": {
				console.log(nowJst(), "default", connectionId);
				const body = JSON.parse(event?.socketBody || "{}");
				if (body.action === "sendMessage") {
					const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
					const apigwManagementApi = new ApiGatewayManagementApiClient({
						endpoint,
					});
					const response = {
						data: {
							message: `EXPRESS: OK Done, your message is '${body.data}'`,
						},
						status: 200,
					};
					if (!connectionId) {
						throw new Error("Missing connectionId");
					}
					await apigwManagementApi.send(
						new PostToConnectionCommand({
							ConnectionId: connectionId,
							Data: JSON.stringify(response),
						}),
					);
					res.status(response.status).json({ data: response.data });
				} else {
					throw new Error("Unknown route");
				}
				break;
			}

			default:
				next();
		}
	} else {
		next();
	}
};
