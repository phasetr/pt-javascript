/**
 * @fileoverview Data generator tests
 */
import { describe, expect, it } from "vitest";
import { generateRandomData, type RandomData } from "../data-generator.js";

describe("generateRandomData", () => {
  it("should generate a single random data entry", () => {
    const result = generateRandomData();
    
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("random_value");
    expect(result).toHaveProperty("created_at");
    
    expect(typeof result.id).toBe("string");
    expect(typeof result.random_value).toBe("number");
    expect(typeof result.created_at).toBe("string");
    
    expect(result.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/); // ULID format
    expect(result.random_value).toBeGreaterThanOrEqual(0);
    expect(result.random_value).toBeLessThan(1);
    expect(new Date(result.created_at)).toBeInstanceOf(Date);
  });

  it("should generate unique IDs for multiple calls", () => {
    const result1 = generateRandomData();
    const result2 = generateRandomData();
    
    expect(result1.id).not.toBe(result2.id);
  });

  it("should generate different random values for multiple calls", () => {
    const results = Array.from({ length: 10 }, () => generateRandomData());
    const values = results.map(r => r.random_value);
    const uniqueValues = new Set(values);
    
    // Extremely unlikely to generate 10 identical random values
    expect(uniqueValues.size).toBeGreaterThan(1);
  });

  it("should generate ISO timestamp format", () => {
    const result = generateRandomData();
    
    expect(result.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});