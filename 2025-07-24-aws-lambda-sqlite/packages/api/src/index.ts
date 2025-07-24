/**
 * @fileoverview Hono Lambda API with SQLite and DynamoDB endpoints
 */
import { Hono } from "hono";

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
	const startTime = Date.now();

	// TODO: Implement EFS SQLite reading
	const responseTime = Date.now() - startTime;

	return c.json({
		data: [],
		response_time_ms: responseTime,
	});
});

app.get("/sqlite-tmp", async (c) => {
	const startTime = Date.now();

	// TODO: Implement tmp SQLite reading (copy from EFS first)
	const responseTime = Date.now() - startTime;

	return c.json({
		data: [],
		response_time_ms: responseTime,
	});
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
