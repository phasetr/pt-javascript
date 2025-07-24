#!/usr/bin/env node
/**
 * @fileoverview ベンチマークアプリのCLIエントリーポイント
 */
import { Command } from "commander";
import { runBenchmark } from "./cli.js";

async function main(): Promise<void> {
	const program = new Command();

	program
		.name("benchmark-run")
		.description("AWS Lambda SQLite vs DynamoDB benchmark execution")
		.version("1.0.0");

	program
		.option("-s, --stack-name <name>", "CloudFormation stack name", "aws-lambda-sqlite-dev")
		.option("-i, --iterations <count>", "Number of iterations per endpoint", "100")
		.option("-o, --output-dir <path>", "Output directory for benchmark results", "docs/benchmarks")
		.action(async (options) => {
			const iterations = Number.parseInt(options.iterations, 10);
			
			if (Number.isNaN(iterations) || iterations <= 0) {
				console.error("Error: iterations must be a positive number");
				process.exit(1);
			}

			try {
				console.log(`Starting benchmark...`);
				console.log(`Stack: ${options.stackName}`);
				console.log(`Iterations: ${iterations} per endpoint`);
				console.log(`Output: ${options.outputDir}`);
				console.log("");

				const result = await runBenchmark({
					stackName: options.stackName,
					iterations,
					outputDir: options.outputDir
				});

				console.log("✓ Benchmark completed successfully!");
				console.log(`Total measurements: ${result.totalMeasurements}`);
				console.log(`Results saved to: ${result.resultsFile}`);
			} catch (error) {
				console.error("✗ Benchmark failed:");
				console.error(error instanceof Error ? error.message : String(error));
				process.exit(1);
			}
		});

	program.parse();
}

main().catch((error) => {
	console.error("Unexpected error:", error);
	process.exit(1);
});