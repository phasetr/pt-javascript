import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import * as cdk from "aws-cdk-lib";
import { CbalStack } from "../lib/cbal-stack";
import type { Construct } from "constructs";
import type { StackProps } from "aws-cdk-lib";

// Mock the CbalStack class
vi.mock("../lib/cbal-stack", () => ({
	CbalStack: vi.fn(),
}));

// Mock process.env to avoid side effects
const originalEnv = process.env;

describe("cbal CDK app", () => {
	// Set up mocks once before all tests
	beforeAll(() => {
		// Reset mocks
		vi.resetModules();
		vi.resetAllMocks();
		process.env = { ...originalEnv };

		// Mock the CbalStack constructor
		(CbalStack as unknown as ReturnType<typeof vi.fn>).mockImplementation(
			(scope: Construct, id: string, props: StackProps) => {
				return { scope, id, props };
			},
		);
	});

	afterAll(() => {
		// Restore process.env
		process.env = originalEnv;
	});

	it("creates stacks with correct environment configurations", async () => {
		// Test both dev and prod environments in a single test

		// 1. Test default environment (dev)
		// Mock App.node.tryGetContext to return undefined for environment
		const mockDevTryGetContext = vi.fn().mockReturnValue(undefined);
		const mockDevApp = {
			node: {
				tryGetContext: mockDevTryGetContext,
			},
		};

		// Mock cdk.App to return our mock app
		const appSpy = vi
			.spyOn(cdk, "App")
			.mockImplementation(() => mockDevApp as unknown as cdk.App);

		// Import the bin file which should create the stack
		const binModule = await import("../bin/cbal");

		// Verify CbalStack was called with the correct parameters for dev
		expect(CbalStack).toHaveBeenCalledWith(
			mockDevApp,
			"CbalStack-dev",
			expect.objectContaining({
				env: {
					region: "ap-northeast-1",
				},
				tags: {
					Environment: "dev",
				},
			}),
		);

		// Reset the mock to test prod environment
		vi.resetAllMocks();

		// 2. Test prod environment
		// Mock App.node.tryGetContext to return 'prod' for environment
		const mockProdTryGetContext = vi.fn().mockImplementation((key: string) => {
			if (key === "environment") return "prod";
			return undefined;
		});

		const mockProdApp = {
			node: {
				tryGetContext: mockProdTryGetContext,
			},
		};

		// Mock cdk.App to return our mock app
		appSpy.mockImplementation(() => mockProdApp as unknown as cdk.App);

		// Re-import the bin file which should create the stack
		vi.resetModules();
		await import("../bin/cbal");

		// Verify CbalStack was called with the correct parameters for prod
		expect(CbalStack).toHaveBeenCalledWith(
			mockProdApp,
			"CbalStack-prod",
			expect.objectContaining({
				env: {
					region: "ap-northeast-1",
				},
				tags: {
					Environment: "prod",
				},
			}),
		);
	});
});
