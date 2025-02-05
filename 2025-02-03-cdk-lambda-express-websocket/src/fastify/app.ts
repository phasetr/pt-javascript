import fastify from "fastify";
import { ApiGatewayManagementApi } from "aws-sdk";
import type { FastifyRequest } from "fastify";
import type { APIGatewayProxyEvent, APIGatewayProxyEventV2 } from "aws-lambda";
import { log } from "node:console";

export interface LambdaFastifyRequest extends FastifyRequest {
	raw: FastifyRequest["raw"] & {
		lambdaEvent?: APIGatewayProxyEvent | APIGatewayProxyEventV2;
	};
}

const app = fastify({ logger: true });

app.all("/*", async (request: LambdaFastifyRequest, reply) => {
	const lambdaEvent = request.raw.lambdaEvent;
	console.log("👺👺👺👺", lambdaEvent);
	console.log(request.raw);

	if (lambdaEvent) {
		const routeKey = lambdaEvent.requestContext?.routeKey;
		const connectionId = (
			lambdaEvent.requestContext as { connectionId?: string }
		).connectionId;

		if (routeKey === "$connect") {
			console.log("connect", connectionId);
			reply.status(200).send({ message: `Connected - ${connectionId}` });
			return;
		}
		if (routeKey === "$disconnect") {
			console.log("disconnect", connectionId);
			reply.status(200).send({ message: `Disconnected - ${connectionId}` });
			return;
		}
		if (routeKey === "$default") {
			try {
				const body = JSON.parse(lambdaEvent.body || "{}");
				if (body.action === "sendMessage") {
					const domainName = lambdaEvent.requestContext?.domainName;
					const stage = lambdaEvent.requestContext?.stage;
					const endpoint = `https://${domainName}/${stage}`;

					const apigwManagementApi = new ApiGatewayManagementApi({
						apiVersion: "2018-11-29",
						endpoint: endpoint,
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

					reply.status(response.status).send({ data: response.data });
					return;
				}
			} catch (error) {
				reply.status(400).send({ message: "Invalid JSON body" });
				return;
			}

			reply.status(400).send({ message: "Unknown route" });
			return;
		}
	}

	// Lambda イベントが存在しない場合は 404 を返す
	reply.status(404).send({ message: "Not Found" });
});

export default app;
