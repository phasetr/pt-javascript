/**
 * Simplified Lambda handler for testing
 */
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";

const app = new Hono();

app.get("/health", (c) => {
	return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/ddb", (c) => {
	return c.json({
		data: [],
		response_time_ms: 0,
		message: "DynamoDB endpoint (not implemented yet)",
	});
});

app.get("/sqlite-efs", (c) => {
	return c.json({
		data: [],
		response_time_ms: 0,
		message: "SQLite EFS endpoint (not implemented yet)",
	});
});

app.get("/sqlite-tmp", (c) => {
	return c.json({
		data: [],
		response_time_ms: 0,
		message: "SQLite tmp endpoint (not implemented yet)",
	});
});

export const handler = handle(app);
