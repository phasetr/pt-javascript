/**
 * @fileoverview CloudFormation stack からLambda URLを取得するためのリゾルバー
 */
import {
	CloudFormationClient,
	DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";

/**
 * CloudFormation stackからApiUrl outputを取得してLambda URLを返す
 * @param stackName - CloudFormation stack名
 * @returns Lambda URL文字列
 * @throws {Error} - stack未発見、ApiUrl output未発見、CloudFormation APIエラー時
 */
export async function resolveLambdaUrl(stackName: string): Promise<string> {
	const client = new CloudFormationClient({
		region: process.env.AWS_REGION || "us-east-1",
	});

	const command = new DescribeStacksCommand({
		StackName: stackName,
	});

	const response = await client.send(command);

	if (!response.Stacks || response.Stacks.length === 0) {
		throw new Error(`Stack '${stackName}' not found`);
	}

	const stack = response.Stacks[0];
	if (!stack?.Outputs) {
		throw new Error(`ApiUrl output not found in stack '${stackName}'`);
	}

	const apiUrlOutput = stack.Outputs.find(
		(output) => output.OutputKey === "ApiUrl",
	);
	if (!apiUrlOutput || !apiUrlOutput.OutputValue) {
		throw new Error(`ApiUrl output not found in stack '${stackName}'`);
	}

	return apiUrlOutput.OutputValue;
}
