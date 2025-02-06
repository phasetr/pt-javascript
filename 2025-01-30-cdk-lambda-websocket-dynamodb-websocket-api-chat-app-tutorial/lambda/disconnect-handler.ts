import type { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import * as AWS from "aws-sdk";

const ddb = new AWS.DynamoDB.DocumentClient();

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
	try {
		await ddb
			.delete({
				TableName: process.env.table ?? "",
				Key: {
					connectionId: event.requestContext.connectionId,
				},
			})
			.promise();

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
