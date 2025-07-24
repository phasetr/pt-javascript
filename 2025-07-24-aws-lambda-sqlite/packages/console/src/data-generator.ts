/**
 * @fileoverview Random data generator for seeding
 */
import { ulid } from "ulid";

/**
 * Random data structure for DynamoDB
 */
export type RandomData = {
  readonly id: string;
  readonly random_value: number;
  readonly created_at: string;
};

/**
 * Generate a single random data entry
 * @returns {RandomData} Generated random data
 */
export function generateRandomData(): RandomData {
  return {
    id: ulid(),
    random_value: Math.random(),
    created_at: new Date().toISOString(),
  };
}