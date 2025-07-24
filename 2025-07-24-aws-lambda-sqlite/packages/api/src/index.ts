/**
 * @fileoverview Hono Lambda API with SQLite and DynamoDB endpoints
 */
import { Hono } from "hono";
import { handleSqliteEfsRequest } from "./sqlite-efs-handler.js";
import { handleSqliteTmpRequest } from "./sqlite-tmp-handler.js";

export const app = new Hono();

app.get("/health", (c) => {
	return c.json({ status: "ok" });
});

app.post("/insert", async (c) => {
	const startTime = Date.now();

	// TODO: Implement DynamoDB data insertion and SQLite file generation
	const responseTime = Date.now() - startTime;

	return c.json({
		message: "Data inserted successfully",
		response_time_ms: responseTime,
	});
});

app.get("/sqlite-efs", async (c) => {
	try {
		const result = await handleSqliteEfsRequest();
		return c.json(result);
	} catch (error) {
		return c.json(
			{
				error: "Failed to read from EFS SQLite",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

app.get("/sqlite-tmp", async (c) => {
	try {
		const result = await handleSqliteTmpRequest();
		return c.json(result);
	} catch (error) {
		return c.json(
			{
				error: "Failed to copy and read from tmp SQLite",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

app.get("/ddb", async (c) => {
	const startTime = Date.now();

	// TODO: Implement DynamoDB reading
	const responseTime = Date.now() - startTime;

	return c.json({
		data: [],
		response_time_ms: responseTime,
	});
});

export default app;

/**
 * Lambda handler export for AWS Lambda
 */
export const handler = app.fetch;
