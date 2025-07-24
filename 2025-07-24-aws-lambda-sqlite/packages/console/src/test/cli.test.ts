/**
 * @fileoverview CLI interface tests
 */
import { describe, expect, it } from "vitest";
import { parseCliArgs } from "../cli.js";

// Mock process.argv
const mockArgv = (args: string[]) => {
	Object.defineProperty(process, "argv", {
		value: ["node", "cli.js", ...args],
		configurable: true,
	});
};

describe("parseCliArgs", () => {
	it("should parse default options", () => {
		mockArgv([]);

		const result = parseCliArgs();

		expect(result).toEqual({
			count: 100,
			tableName: "aws-lambda-sqlite-dev-main",
		});
	});

	it("should parse custom count option", () => {
		mockArgv(["--count", "1000"]);

		const result = parseCliArgs();

		expect(result).toEqual({
			count: 1000,
			tableName: "aws-lambda-sqlite-dev-main",
		});
	});

	it("should parse custom table name", () => {
		mockArgv(["--table", "custom-table"]);

		const result = parseCliArgs();

		expect(result).toEqual({
			count: 100,
			tableName: "custom-table",
		});
	});

	it("should parse both count and table options", () => {
		mockArgv(["--count", "500", "--table", "test-table"]);

		const result = parseCliArgs();

		expect(result).toEqual({
			count: 500,
			tableName: "test-table",
		});
	});

	it("should handle short option aliases", () => {
		mockArgv(["-c", "250", "-t", "short-table"]);

		const result = parseCliArgs();

		expect(result).toEqual({
			count: 250,
			tableName: "short-table",
		});
	});

	it("should validate count is positive integer", () => {
		mockArgv(["--count", "0"]);

		expect(() => parseCliArgs()).toThrow("Count must be a positive integer");
	});

	it("should validate count is not negative", () => {
		mockArgv(["--count", "-1"]);

		expect(() => parseCliArgs()).toThrow("Count must be a positive integer");
	});

	it("should validate table name is not empty", () => {
		mockArgv(["--table", ""]);

		expect(() => parseCliArgs()).toThrow("Table name cannot be empty");
	});
});
