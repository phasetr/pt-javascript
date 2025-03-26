import {
	DynamoDBClient,
	CreateTableCommand,
	DeleteTableCommand,
} from "@aws-sdk/client-dynamodb";
import {
	DynamoDBDocumentClient,
	PutCommand,
	GetCommand,
	QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import fetch, { type RequestInit } from "node-fetch";
import { vi } from "vitest";

// Mock environment variables
process.env.TABLE_NAME = "CIIC-test-DDB";
process.env.ENVIRONMENT = "test";

// Create a mock DynamoDB client
export const mockDynamoDBClient = new DynamoDBClient({
	region: "local",
	endpoint: "http://localhost:8000",
	credentials: {
		accessKeyId: "test",
		secretAccessKey: "test",
	},
});

export const mockDocClient = DynamoDBDocumentClient.from(mockDynamoDBClient);

// Create and delete test table
export async function createTestTable(): Promise<void> {
	try {
		await mockDynamoDBClient.send(
			new CreateTableCommand({
				TableName: process.env.TABLE_NAME,
				KeySchema: [
					{ AttributeName: "PK", KeyType: "HASH" },
					{ AttributeName: "SK", KeyType: "RANGE" },
				],
				AttributeDefinitions: [
					{ AttributeName: "PK", AttributeType: "S" },
					{ AttributeName: "SK", AttributeType: "S" },
					{ AttributeName: "entity", AttributeType: "S" },
					{ AttributeName: "id", AttributeType: "S" },
				],
				GlobalSecondaryIndexes: [
					{
						IndexName: "EntityIndex",
						KeySchema: [
							{ AttributeName: "entity", KeyType: "HASH" },
							{ AttributeName: "id", KeyType: "RANGE" },
						],
						Projection: {
							ProjectionType: "ALL",
						},
						ProvisionedThroughput: {
							ReadCapacityUnits: 5,
							WriteCapacityUnits: 5,
						},
					},
				],
				ProvisionedThroughput: {
					ReadCapacityUnits: 5,
					WriteCapacityUnits: 5,
				},
			}),
		);
		console.log("Test table created");
	} catch (error) {
		console.error("Error creating test table:", error);
		throw error;
	}
}

export async function deleteTestTable(): Promise<void> {
	try {
		await mockDynamoDBClient.send(
			new DeleteTableCommand({
				TableName: process.env.TABLE_NAME,
			}),
		);
		console.log("Test table deleted");
	} catch (error) {
		console.error("Error deleting test table:", error);
	}
}

// Create a test item
export async function createTestItem(
	id: string,
	name: string,
	description: string,
): Promise<string> {
	try {
		await mockDocClient.send(
			new PutCommand({
				TableName: process.env.TABLE_NAME,
				Item: {
					PK: `ITEM#${id}`,
					SK: `ITEM#${id}`,
					id: id,
					entity: "item",
					name: name,
					description: description,
					createdAt: new Date().toISOString(),
					environment: process.env.ENVIRONMENT,
				},
			}),
		);
		return id;
	} catch (error) {
		console.error("Error creating test item:", error);
		throw error;
	}
}

// Create a test Hono app
export function createTestApp(): any {
	// Mock the DynamoDB client in the app
	vi.mock("@aws-sdk/client-dynamodb", () => ({
		DynamoDBClient: vi.fn().mockImplementation(() => mockDynamoDBClient),
	}));

	vi.mock("@aws-sdk/lib-dynamodb", () => ({
		DynamoDBDocumentClient: {
			from: vi.fn().mockImplementation(() => mockDocClient),
		},
		PutCommand: PutCommand,
		GetCommand: GetCommand,
		QueryCommand: QueryCommand,
	}));

	// Import the app after mocking
	const { app } = require("../src/index");
	return app;
}

// Helper function to make requests to the Hono app
export async function request(
	app: any,
	method: string,
	path: string,
	body?: Record<string, unknown>,
): Promise<{ status: number; body: any }> {
	const url = `http://localhost${path}`;
	const options: RequestInit = {
		method,
		headers: {
			"Content-Type": "application/json",
		},
	};

	if (body) {
		options.body = JSON.stringify(body);
	}

	const response = await fetch(url, options);
	const responseBody = await response.json();

	return {
		status: response.status,
		body: responseBody,
	};
}
