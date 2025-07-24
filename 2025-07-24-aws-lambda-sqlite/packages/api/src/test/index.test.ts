/**
 * @fileoverview Hono API tests
 */
import { describe, expect, it } from "vitest";
import { app } from "../index.js";

describe("API", () => {
	it("should handle GET /health", async () => {
		const res = await app.request("/health");

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toEqual({ status: "ok" });
	});

	it("should handle POST /insert", async () => {
		const res = await app.request("/insert", {
			method: "POST",
		});

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("message");
	});

	it("should handle GET /sqlite-efs", async () => {
		const res = await app.request("/sqlite-efs");

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("data");
		expect(json).toHaveProperty("response_time_ms");
	});

	it("should handle GET /sqlite-tmp", async () => {
		const res = await app.request("/sqlite-tmp");

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("data");
		expect(json).toHaveProperty("response_time_ms");
	});

	it("should handle GET /ddb", async () => {
		const res = await app.request("/ddb");

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toHaveProperty("data");
		expect(json).toHaveProperty("response_time_ms");
	});
});
