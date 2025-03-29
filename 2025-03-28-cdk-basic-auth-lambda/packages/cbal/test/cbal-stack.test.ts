import { describe, it, expect, beforeAll, vi } from "vitest";
import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { CbalStack } from "../lib/cbal-stack";

// Mock dotenv.config() to avoid loading .env files during tests
vi.mock("dotenv", () => ({
	config: vi.fn(),
}));

describe("CbalStack", () => {
	// Create shared app and stack instances for dev environment
	let devApp: cdk.App;
	let devStack: CbalStack;
	let devTemplate: Template;

	// Create shared app and stack instances for prod environment
	let prodApp: cdk.App;
	let prodStack: CbalStack;
	let prodTemplate: Template;

	// Set up the stacks once before all tests
	beforeAll(() => {
		// Create dev environment stack
		devApp = new cdk.App({
			context: {
				environment: "dev",
			},
		});
		devStack = new CbalStack(devApp, "TestStack", {
			env: { region: "ap-northeast-1" },
		});
		devTemplate = Template.fromStack(devStack);

		// Create prod environment stack
		prodApp = new cdk.App({
			context: {
				environment: "prod",
			},
		});
		prodStack = new CbalStack(prodApp, "TestProdStack", {
			env: { region: "ap-northeast-1" },
		});
		prodTemplate = Template.fromStack(prodStack);
	});

	it("creates a DynamoDB table with the correct configuration", () => {
		// Verify the DynamoDB table exists and has correct properties in a single assertion
		devTemplate.hasResourceProperties("AWS::DynamoDB::Table", {
			KeySchema: [
				{
					AttributeName: "id",
					KeyType: "HASH",
				},
			],
			GlobalSecondaryIndexes: [
				{
					KeySchema: [
						{
							AttributeName: "userId",
							KeyType: "HASH",
						},
					],
					Projection: {
						ProjectionType: "ALL",
					},
				},
			],
		});
	});

	it("creates Secrets Manager secrets for app config and basic auth", () => {
		// Verify both secrets in a single test
		const secretResources = devTemplate.findResources(
			"AWS::SecretsManager::Secret",
		);
		const secretKeys = Object.keys(secretResources);

		// Verify we have at least 2 secrets
		expect(secretKeys.length).toBeGreaterThanOrEqual(2);

		// Find the AppConfig secret
		const appConfigSecret = secretKeys.find(
			(key) => secretResources[key].Properties.Name === "CBAL-dev/AppConfig",
		);
		expect(appConfigSecret).toBeDefined();

		// Find the BasicAuth secret
		const basicAuthSecret = secretKeys.find(
			(key) => secretResources[key].Properties.Name === "CBAL-dev/BasicAuth",
		);
		expect(basicAuthSecret).toBeDefined();
	});

	it("creates a Lambda function with the correct configuration", () => {
		// Verify Lambda function properties in a single assertion
		const lambdaResources = devTemplate.findResources("AWS::Lambda::Function");
		const lambdaKeys = Object.keys(lambdaResources);
		expect(lambdaKeys.length).toBe(1);

		const lambda = lambdaResources[lambdaKeys[0]];
		expect(lambda.Properties.MemorySize).toBe(512);
		expect(lambda.Properties.Timeout).toBe(30);
		expect(lambda.Properties.Architectures).toContain("arm64");
		expect(lambda.Properties.Environment.Variables).toHaveProperty(
			"APP_CONFIG_SECRET_NAME",
		);
		expect(lambda.Properties.Environment.Variables).toHaveProperty(
			"BASIC_AUTH_SECRET_NAME",
		);
	});

	it("creates an API Gateway and outputs the endpoint URL", () => {
		// Combine API Gateway tests
		devTemplate.resourceCountIs("AWS::ApiGateway::RestApi", 1);
		devTemplate.hasOutput("*", {
			Description: "API Gateway endpoint URL",
		});
	});

	it("creates resources with the correct environment-specific configuration", () => {
		// Test prod environment configuration
		// Verify Lambda timeout is different in prod
		prodTemplate.hasResourceProperties("AWS::Lambda::Function", {
			Timeout: 60,
		});

		// Verify app config secret name is correct for prod
		prodTemplate.hasResourceProperties("AWS::SecretsManager::Secret", {
			Name: "CBAL-prod/AppConfig",
		});

		// Verify the secret string template contains the prod environment
		const secretResources = prodTemplate.findResources(
			"AWS::SecretsManager::Secret",
		);
		const secretKeys = Object.keys(secretResources);

		// Find the AppConfig secret
		const appConfigSecret = secretKeys.find(
			(key) => secretResources[key].Properties.Name === "CBAL-prod/AppConfig",
		);

		if (appConfigSecret) {
			const secretStringTemplate =
				secretResources[appConfigSecret].Properties.GenerateSecretString
					.SecretStringTemplate;
			expect(secretStringTemplate).toContain('"environment":"prod"');
		} else {
			throw new Error("AppConfig secret not found");
		}
	});
});
