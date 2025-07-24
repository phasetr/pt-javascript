/**
 * @fileoverview Lambda URL resolver tests
 */
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import { describe, expect, it, vi } from "vitest";
import { resolveLambdaUrl } from "../lambda-url-resolver.js";

// Mock AWS SDK
vi.mock("@aws-sdk/client-cloudformation");

const mockSend = vi.fn();

describe("resolveLambdaUrl", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(CloudFormationClient as any)
			.mockImplementation(() => ({ send: mockSend }));
	});

	it("should resolve Lambda URL from CloudFormation stack", async () => {
		mockSend.mockResolvedValue({
			Stacks: [{
				Outputs: [{
					OutputKey: "ApiUrl",
					OutputValue: "https://abc123.lambda-url.us-east-1.on.aws/"
				}]
			}]
		});

		const result = await resolveLambdaUrl("test-stack");

		expect(result).toBe("https://abc123.lambda-url.us-east-1.on.aws/");
		expect(CloudFormationClient).toHaveBeenCalledWith({
			region: process.env.AWS_REGION || "us-east-1"
		});
		expect(mockSend).toHaveBeenCalledTimes(1);
		const command = mockSend.mock.calls[0]?.[0];
		expect(command?.constructor.name).toBe("DescribeStacksCommand");
	});

	it("should handle stack not found", async () => {
		mockSend.mockResolvedValue({
			Stacks: []
		});

		await expect(resolveLambdaUrl("nonexistent-stack"))
			.rejects.toThrow("Stack 'nonexistent-stack' not found");
	});

	it("should handle missing ApiUrl output", async () => {
		mockSend.mockResolvedValue({
			Stacks: [{
				Outputs: [{
					OutputKey: "SomeOtherOutput",
					OutputValue: "some-value"
				}]
			}]
		});

		await expect(resolveLambdaUrl("test-stack"))
			.rejects.toThrow("ApiUrl output not found in stack 'test-stack'");
	});

	it("should handle CloudFormation errors", async () => {
		mockSend.mockRejectedValue(new Error("CloudFormation error"));

		await expect(resolveLambdaUrl("test-stack"))
			.rejects.toThrow("CloudFormation error");
	});

	it("should use custom AWS region", async () => {
		process.env.AWS_REGION = "ap-northeast-1";
		
		mockSend.mockResolvedValue({
			Stacks: [{
				Outputs: [{
					OutputKey: "ApiUrl",
					OutputValue: "https://xyz789.lambda-url.ap-northeast-1.on.aws/"
				}]
			}]
		});

		const result = await resolveLambdaUrl("test-stack");

		expect(result).toBe("https://xyz789.lambda-url.ap-northeast-1.on.aws/");
		expect(CloudFormationClient).toHaveBeenCalledWith({
			region: "ap-northeast-1"
		});

		// Reset environment variable
		delete process.env.AWS_REGION;
	});
});