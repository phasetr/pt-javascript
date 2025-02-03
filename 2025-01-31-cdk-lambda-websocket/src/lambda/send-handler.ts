import type { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import AWS from "aws-sdk";

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
	try {
		const { message } = JSON.parse(event.body ?? "{}");
		console.log("受信メッセージ:", message);

		const connectionId = event.requestContext.connectionId;
		console.log("クライアントの接続ID:", connectionId);

		const apigwManagementApi = new AWS.ApiGatewayManagementApi({
			apiVersion: "2018-11-29",
			endpoint: `${event.requestContext.domainName}/${event.requestContext.stage}`,
		});

		const response = {
			message: `FROM AWS: your message is '${message}'`,
		};

		// 指定されたconnectionIdへメッセージを投稿
		await apigwManagementApi
			.postToConnection({
				ConnectionId: connectionId,
				Data: JSON.stringify(response),
			})
			.promise();

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
