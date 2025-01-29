import type { APIGatewayProxyEvent, Context } from "aws-lambda";

export const handler = async (
	event: APIGatewayProxyEvent,
	context: Context,
) => ({
	statusCode: 200,
	headers: {},
	body: { message: "Hello World!" },
});
