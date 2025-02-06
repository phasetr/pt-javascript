import type { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import * as AWS from "aws-sdk";

const ddb = new AWS.DynamoDB.DocumentClient();

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
	try {
		const result = await ddb
			.scan({ TableName: process.env.table ?? "" })
			.promise();
		const connections = result.Items as { connectionId: string }[];

		const callbackAPI = new AWS.ApiGatewayManagementApi({
			apiVersion: "2018-11-29",
			endpoint: `${event.requestContext.domainName}/${event.requestContext.stage}`,
		});

		const message = JSON.parse(event.body ?? "{}").message;

		const sendMessages = connections.map(async ({ connectionId }) => {
			if (connectionId === event.requestContext.connectionId) return;

			try {
				await callbackAPI
					.postToConnection({ ConnectionId: connectionId, Data: message })
					.promise();
			} catch (e) {
				console.error(`Error sending message to ${connectionId}:`, e);
			}
		});

		await Promise.all(sendMessages);

		return {
			statusCode: 200,
		};
	} catch (e) {
		console.error("Error in send-handler:", e);
		return {
			statusCode: 500,
		};
	}
};
