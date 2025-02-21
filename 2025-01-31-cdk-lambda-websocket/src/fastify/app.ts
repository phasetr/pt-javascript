import fastify from "fastify";
import {
	ApiGatewayManagementApiClient,
	PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import type { FastifyRequest } from "fastify";
import type { APIGatewayProxyEvent, APIGatewayProxyEventV2 } from "aws-lambda";

export interface LambdaFastifyRequest extends FastifyRequest {
	raw: FastifyRequest["raw"] & {
		lambdaEvent?: APIGatewayProxyEvent | APIGatewayProxyEventV2;
	};
}

const app = fastify({ logger: true });

app.all("/*", async (request: LambdaFastifyRequest, reply) => {
	// TODO: これが空で以下の条件分岐処理まで進めない
	const lambdaEvent = request.raw.lambdaEvent;
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

					const apigwManagementApi = new ApiGatewayManagementApiClient({
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

					await apigwManagementApi.send(
						new PostToConnectionCommand({
							ConnectionId: connectionId,
							Data: JSON.stringify(response),
						}),
					);

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
