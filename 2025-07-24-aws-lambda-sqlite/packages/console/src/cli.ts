/**
 * @fileoverview CLI interface for data seeding
 */
import { Command } from "commander";
import { seedToDynamoDB } from "./dynamodb-seeder.js";

/**
 * CLI options structure
 */
export type CliOptions = {
  readonly count: number;
  readonly tableName: string;
};

/**
 * Parse command line arguments
 * @returns {CliOptions} Parsed CLI options
 * @throws {Error} When validation fails
 */
export function parseCliArgs(): CliOptions {
  const program = new Command();
  
  program
    .name("console-seed")
    .description("Generate and insert random data into DynamoDB")
    .option("-c, --count <number>", "Number of records to generate", "100")
    .option("-t, --table <name>", "DynamoDB table name", "aws-lambda-sqlite-dev-main")
    .parse();

  const options = program.opts();
  
  const count = Number.parseInt(options.count, 10);
  if (Number.isNaN(count) || count <= 0) {
    throw new Error("Count must be a positive integer");
  }
  
  const tableName = options.table.trim();
  if (tableName === "") {
    throw new Error("Table name cannot be empty");
  }
  
  return {
    count,
    tableName,
  };
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  try {
    const options = parseCliArgs();
    console.log(`Seeding ${options.count} records to table: ${options.tableName}`);
    
    await seedToDynamoDB(options);
    
    console.log("Seeding completed successfully");
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}