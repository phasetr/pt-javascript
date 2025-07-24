/**
 * @fileoverview DynamoDB seeder implementation
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { generateRandomData } from "./data-generator.js";

/**
 * Seeding options
 */
export type SeedOptions = {
  readonly count: number;
  readonly tableName: string;
};

/**
 * Transform RandomData to DynamoDB item format
 * @param data - Random data to transform
 * @returns DynamoDB item
 */
function transformToDynamoDBItem(data: ReturnType<typeof generateRandomData>) {
  const dateOnly = data.created_at.split("T")[0];
  
  return {
    PK: `RANDOM#${dateOnly}`,
    SK: `ITEM#${data.id}`,
    GSI1PK: "RANDOM",
    GSI1SK: data.created_at,
    entity: "random",
    id: data.id,
    random_value: data.random_value,
    created_at: data.created_at,
  };
}

/**
 * Seed random data to DynamoDB
 * @param options - Seeding options
 */
export async function seedToDynamoDB(options: SeedOptions): Promise<void> {
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
  });
  
  const docClient = DynamoDBDocumentClient.from(client);
  
  for (let i = 0; i < options.count; i++) {
    const data = generateRandomData();
    const item = transformToDynamoDBItem(data);
    
    const command = new PutCommand({
      TableName: options.tableName,
      Item: item,
    });
    
    await docClient.send(command);
  }
}