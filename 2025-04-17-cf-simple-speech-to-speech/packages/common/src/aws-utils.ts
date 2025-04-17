/**
 * AWS関連のユーティリティ関数
 */
import {
	CloudFormationClient,
	DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

/**
 * CloudFormationスタックから出力値を取得する
 * @param stackName スタック名
 * @param outputKey 出力キー
 * @param region AWSリージョン
 * @returns 出力値
 */
export async function getStackOutput(
	stackName: string,
	outputKey: string,
	region = "ap-northeast-1",
): Promise<string> {
	const cfnClient = new CloudFormationClient({ region });
	const command = new DescribeStacksCommand({ StackName: stackName });

	try {
		const response = await cfnClient.send(command);
		const stack = response.Stacks?.[0];

		if (!stack) {
			throw new Error(`Stack ${stackName} not found`);
		}

		const output = stack.Outputs?.find((o) => o.OutputKey === outputKey);

		if (!output || !output.OutputValue) {
			throw new Error(`Output ${outputKey} not found in stack ${stackName}`);
		}

		return output.OutputValue;
	} catch (error) {
		console.error("Error getting stack output:", error);
		throw error;
	}
}

/**
 * SQSキューにメッセージを送信する
 * @param queueUrl SQSキューのURL
 * @param messageBody メッセージ本文
 * @param region AWSリージョン
 * @returns メッセージID
 */
export async function sendMessageToSQS(
	queueUrl: string,
	messageBody: string,
	region = "ap-northeast-1",
): Promise<string> {
	const sqsClient = new SQSClient({ region });
	const command = new SendMessageCommand({
		QueueUrl: queueUrl,
		MessageBody: messageBody,
	});

	try {
		const response = await sqsClient.send(command);
		if (!response.MessageId) {
			throw new Error("Failed to send message to SQS: No MessageId returned");
		}
		return response.MessageId;
	} catch (error) {
		console.error("Error sending message to SQS:", error);
		throw error;
	}
}

/**
 * メール送信用のメッセージ型定義
 */
export interface EmailMessage {
	from: string;
	to: string;
	subject: string;
	text: string;
	attachments?: Array<{
		content: string;
		filename: string;
		contentType: string;
	}>;
	requestInfo?: {
		ip: string;
		userAgent: string;
		timestamp: string;
		requestId: string;
		path: string;
		method: string;
	};
}
