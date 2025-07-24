/**
 * @fileoverview DynamoDB operations for single-table design
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
	DynamoDBDocumentClient,
	PutCommand,
	QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";

const TABLE_NAME =
	process.env.DYNAMODB_TABLE_NAME || "aws-lambda-sqlite-dev-main";

/**
 * Creates a DynamoDB document client
 * @returns DynamoDB document client instance
 */
export function createDocClient(): DynamoDBDocumentClient {
	const client = new DynamoDBClient({
		region: process.env.AWS_REGION || "us-east-1",
	});
	return DynamoDBDocumentClient.from(client);
}

/**
 * Random entity type definition
 */
export type RandomEntity = {
	readonly PK: string;
	readonly SK: string;
	readonly GSI1PK: string;
	readonly GSI1SK: string;
	readonly entity: "random";
	readonly id: string;
	readonly random_value: number;
	readonly created_at: string;
};

/**
 * Benchmark session entity type definition
 */
export type BenchmarkSessionEntity = {
	readonly PK: string;
	readonly SK: string;
	readonly GSI1PK: string;
	readonly GSI1SK: string;
	readonly entity: "benchmark_session";
	readonly session_id: string;
	readonly executed_at: string;
	readonly iterations: number;
	readonly data_count: number;
	readonly summary: Record<
		string,
		{
			readonly avg: number;
			readonly min: number;
			readonly max: number;
			readonly std: number;
		}
	>;
};

/**
 * Benchmark result entity type definition
 */
export type BenchmarkResultEntity = {
	readonly PK: string;
	readonly SK: string;
	readonly GSI1PK: string;
	readonly GSI1SK: string;
	readonly entity: "benchmark_result";
	readonly session_id: string;
	readonly result_id: string;
	readonly endpoint: "sqlite-efs" | "sqlite-tmp" | "ddb";
	readonly response_time_ms: number;
	readonly copy_time_ms?: number;
	readonly read_time_ms: number;
	readonly measured_at: string;
};

/**
 * Creates a random entity with proper partition key for current date
 * @param randomValue - Random value to store (0-1)
 * @returns RandomEntity ready for DynamoDB insertion
 */
export function createRandomEntity(randomValue: number): RandomEntity {
	const now = new Date();
	const id = ulid();
	const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
	const createdAt = now.toISOString();

	return {
		PK: `RANDOM#${dateStr}`,
		SK: `ITEM#${id}`,
		GSI1PK: "RANDOM",
		GSI1SK: createdAt,
		entity: "random",
		id,
		random_value: randomValue,
		created_at: createdAt,
	};
}

/**
 * Insert random entity into DynamoDB
 * @param entity - RandomEntity to insert
 * @returns Promise resolving when insertion is complete
 */
export async function insertRandomEntity(entity: RandomEntity): Promise<void> {
	const docClient = createDocClient();
	const command = new PutCommand({
		TableName: TABLE_NAME,
		Item: entity,
	});

	await docClient.send(command);
}

/**
 * Insert multiple random entities into DynamoDB
 * @param count - Number of random entities to create and insert
 * @returns Promise resolving to array of created entities
 */
export async function insertRandomEntities(
	count: number,
): Promise<ReadonlyArray<RandomEntity>> {
	const entities: RandomEntity[] = [];

	for (let i = 0; i < count; i++) {
		const randomValue = Math.random();
		const entity = createRandomEntity(randomValue);
		await insertRandomEntity(entity);
		entities.push(entity);
	}

	return entities;
}

/**
 * Get all random entities from DynamoDB (using GSI for cross-partition query)
 * @returns Promise resolving to array of random entities
 */
export async function getAllRandomEntities(): Promise<
	ReadonlyArray<RandomEntity>
> {
	const docClient = createDocClient();
	const command = new QueryCommand({
		TableName: TABLE_NAME,
		IndexName: "GSI1",
		KeyConditionExpression: "GSI1PK = :gsi1pk",
		ExpressionAttributeValues: {
			":gsi1pk": "RANDOM",
		},
	});

	const result = await docClient.send(command);
	return (result.Items || []) as RandomEntity[];
}

/**
 * Get random entities for specific date
 * @param date - Date string in YYYY-MM-DD format
 * @returns Promise resolving to array of random entities for that date
 */
export async function getRandomEntitiesByDate(
	date: string,
): Promise<ReadonlyArray<RandomEntity>> {
	const docClient = createDocClient();
	const command = new QueryCommand({
		TableName: TABLE_NAME,
		KeyConditionExpression: "PK = :pk",
		ExpressionAttributeValues: {
			":pk": `RANDOM#${date}`,
		},
	});

	const result = await docClient.send(command);
	return (result.Items || []) as RandomEntity[];
}
