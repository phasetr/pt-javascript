import type { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
	try {
		return {
			statusCode: 200,
		};
	} catch (e) {
		console.error(e);
		return {
			statusCode: 500,
		};
	}
};
