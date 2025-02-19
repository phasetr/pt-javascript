import type { Request, Response, NextFunction } from "express";
import type { APIGatewayEvent } from "aws-lambda";
import { ApiGatewayManagementApi } from "aws-sdk";

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
				console.log("connect", connectionId);
				res.status(200).json({ message: `Connected - ${connectionId}` });
				break;

			case "$disconnect":
				console.log("disconnect", connectionId);
				res.status(200).json({ message: `Disconnected - ${connectionId}` });
				break;

			case "$default": {
				const body = JSON.parse(event?.socketBody || "{}");
				if (body.action === "sendMessage") {
					const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
					const apigwManagementApi = new ApiGatewayManagementApi({
						apiVersion: "2018-11-29",
						endpoint,
					});
					const response = {
						data: {
							message: `OK Done, your message is '${body.data}'`,
						},
						status: 200,
					};
					if (!connectionId) {
						throw new Error("Missing connectionId");
					}
					await apigwManagementApi
						.postToConnection({
							ConnectionId: connectionId,
							Data: JSON.stringify(response),
						})
						.promise();
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
