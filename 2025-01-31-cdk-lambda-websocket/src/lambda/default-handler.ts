import type { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import * as AWS from "aws-sdk";

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
	try {
		const callbackAPI = new AWS.ApiGatewayManagementApi({
			apiVersion: "2018-11-29",
			endpoint: `${event.requestContext.domainName}/${event.requestContext.stage}`,
		});

		const connectionInfo = await callbackAPI
			.getConnection({
				ConnectionId: event.requestContext.connectionId,
			})
			.promise();
		const info = {
			...connectionInfo,
			connectionId: event.requestContext.connectionId,
		};

		await callbackAPI
			.postToConnection({
				ConnectionId: event.requestContext.connectionId,
				Data: `Use the send-message route to send a message. Your info:${JSON.stringify(info)}`,
			})
			.promise();

		return {
			statusCode: 200,
		};
	} catch (error) {
		console.error("Defaultハンドラーでエラーが発生しました:", error);
		return {
			statusCode: 500,
		};
	}
};
