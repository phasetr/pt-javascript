/**
 * @fileoverview DynamoDB seeder tests
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { describe, expect, it, vi, type MockedFunction } from "vitest";
import { seedToDynamoDB, type SeedOptions } from "../dynamodb-seeder.js";
import { type RandomData } from "../data-generator.js";

// Mock AWS SDK
vi.mock("@aws-sdk/client-dynamodb");
vi.mock("@aws-sdk/lib-dynamodb");

// Mock data generator
vi.mock("../data-generator.js", () => ({
  generateRandomData: vi.fn()
}));

const mockSend = vi.fn();
const mockFrom = vi.fn().mockReturnValue({ send: mockSend });

describe("seedToDynamoDB", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (DynamoDBDocumentClient.from as MockedFunction<typeof DynamoDBDocumentClient.from>).mockImplementation(mockFrom);
  });

  it("should seed single record to DynamoDB", async () => {
    const mockData: RandomData = {
      id: "01HXAMPLE123456789ABCDEFGHJ",
      random_value: 0.123456,
      created_at: "2025-07-24T10:30:00.000Z"
    };

    const { generateRandomData } = await import("../data-generator.js");
    (generateRandomData as MockedFunction<typeof generateRandomData>).mockReturnValue(mockData);
    
    mockSend.mockResolvedValue({});

    const options: SeedOptions = {
      count: 1,
      tableName: "test-table"
    };

    await seedToDynamoDB(options);

    expect(DynamoDBClient).toHaveBeenCalledWith({
      region: process.env.AWS_REGION || "us-east-1"
    });
    expect(DynamoDBDocumentClient.from).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledTimes(1);
    
    // Verify that send was called with a PutCommand
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        constructor: expect.objectContaining({
          name: "PutCommand"
        })
      })
    );
  });

  it("should seed multiple records to DynamoDB", async () => {
    const mockData1: RandomData = {
      id: "01HXAMPLE123456789ABCDEFGH1",
      random_value: 0.111111,
      created_at: "2025-07-24T10:30:00.000Z"
    };

    const mockData2: RandomData = {
      id: "01HXAMPLE123456789ABCDEFGH2",
      random_value: 0.222222,
      created_at: "2025-07-24T10:30:01.000Z"
    };

    const { generateRandomData } = await import("../data-generator.js");
    (generateRandomData as MockedFunction<typeof generateRandomData>)
      .mockReturnValueOnce(mockData1)
      .mockReturnValueOnce(mockData2);
    
    mockSend.mockResolvedValue({});

    const options: SeedOptions = {
      count: 2,
      tableName: "test-table"
    };

    await seedToDynamoDB(options);

    expect(mockSend).toHaveBeenCalledTimes(2);
    
    // Verify both calls were PutCommands
    expect(mockSend).toHaveBeenNthCalledWith(1, expect.objectContaining({
      constructor: expect.objectContaining({
        name: "PutCommand"
      })
    }));
    expect(mockSend).toHaveBeenNthCalledWith(2, expect.objectContaining({
      constructor: expect.objectContaining({
        name: "PutCommand"
      })
    }));
  });

  it("should handle DynamoDB errors", async () => {
    const mockData: RandomData = {
      id: "01HXAMPLE123456789ABCDEFGHJ",
      random_value: 0.123456,
      created_at: "2025-07-24T10:30:00.000Z"
    };

    const { generateRandomData } = await import("../data-generator.js");
    (generateRandomData as MockedFunction<typeof generateRandomData>).mockReturnValue(mockData);
    
    mockSend.mockRejectedValue(new Error("DynamoDB error"));

    const options: SeedOptions = {
      count: 1,
      tableName: "test-table"
    };

    await expect(seedToDynamoDB(options)).rejects.toThrow("DynamoDB error");
  });

  it("should use correct partition key for date", async () => {
    const mockData: RandomData = {
      id: "01HXAMPLE123456789ABCDEFGHJ",
      random_value: 0.123456,
      created_at: "2025-12-31T23:59:59.999Z"
    };

    const { generateRandomData } = await import("../data-generator.js");
    (generateRandomData as MockedFunction<typeof generateRandomData>).mockReturnValue(mockData);
    
    mockSend.mockResolvedValue({});

    const options: SeedOptions = {
      count: 1,
      tableName: "test-table"
    };

    await seedToDynamoDB(options);

    // Verify that send was called with a PutCommand
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        constructor: expect.objectContaining({
          name: "PutCommand"
        })
      })
    );
  });
});