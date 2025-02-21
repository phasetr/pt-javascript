import type { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import {
	ApiGatewayManagementApiClient,
	PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
	try {
		const { message } = JSON.parse(event.body ?? "{}");
		console.log("受信メッセージ:", message);

		const connectionId = event.requestContext.connectionId;
		console.log("クライアントの接続ID:", connectionId);

		// v3 のクライアントを生成
		const client = new ApiGatewayManagementApiClient({
			endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
		});

		const response = {
			message: `FROM AWS LAMBDA: your message is '${message}'`,
		};

		// 指定された connectionId へメッセージを投稿
		await client.send(
			new PostToConnectionCommand({
				ConnectionId: connectionId,
				Data: JSON.stringify(response),
			}),
		);

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
