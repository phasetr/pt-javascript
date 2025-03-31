import type { SQSEvent, SQSRecord, Context, SQSHandler } from "aws-lambda";
import { sendEmail } from "./email";
import { processMessage } from "./message";

/**
 * 処理結果の型定義
 */
interface ProcessResult {
  messageId: string;
  result: 'success' | 'error';
  emailResult?: {
    messageId: string;
    recipient: string;
  };
  error?: string;
}

/**
 * Lambda関数のハンドラー
 * SQSキューからメッセージを受け取り、処理してメールを送信する
 */
export const handler: SQSHandler = async (
	event: SQSEvent,
	_context: Context,
): Promise<void> => {
	console.log("Event received:", JSON.stringify(event, null, 2));

	try {
		// 各SQSメッセージを処理
		const results = await Promise.all(
			event.Records.map(async (record: SQSRecord) => {
				return await processRecord(record);
			}),
		);

		console.log("Processing completed:", results);
		// SQSハンドラーは戻り値を使用しないため、ログ出力のみ行う
	} catch (error) {
		console.error("Error processing messages:", error);
		throw error;
	}
};

/**
 * 個別のSQSレコードを処理する
 */
async function processRecord(record: SQSRecord): Promise<ProcessResult> {
	try {
		console.log("Processing record:", record.messageId);

		// メッセージの内容を取得
		const messageBody = record.body;
		console.log("Message body:", messageBody);

		// メッセージを処理してメール本文を作成
		const emailContent = processMessage(messageBody);

		// メールを送信
		const result = await sendEmail(emailContent);

		return {
			messageId: record.messageId,
			result: "success",
			emailResult: result,
		};
	} catch (error) {
		console.error(`Error processing record ${record.messageId}:`, error);
		return {
			messageId: record.messageId,
			result: "error",
			error: error instanceof Error ? error.message : String(error),
		};
	}
}
