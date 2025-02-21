import type { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import {
	ApiGatewayManagementApiClient,
	PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
	try {
		// v3 のクライアントを生成
		const client = new ApiGatewayManagementApiClient({
			endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
		});

		const info = {
			connectionId: event.requestContext.connectionId,
		};

		// PostToConnectionCommand を送信
		await client.send(
			new PostToConnectionCommand({
				ConnectionId: event.requestContext.connectionId,
				Data: `Use the send-message route to send a message. Your info:${JSON.stringify(info)}`,
			}),
		);

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
