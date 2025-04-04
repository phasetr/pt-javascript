import type { SQSEvent, SQSHandler, SQSRecord } from "aws-lambda";
import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
import { createTransport } from "nodemailer";
import type { Transporter } from "nodemailer";
import type { Options as MailOptions } from "nodemailer/lib/mailer";

/**
 * ログ出力用のヘルパー関数
 * 構造化ログを出力する
 */
function logInfo(message: string, data?: Record<string, unknown>): void {
	console.log(JSON.stringify({
		level: "INFO",
		timestamp: new Date().toISOString(),
		message,
		...data
	}));
}

function logError(message: string, error?: unknown, data?: Record<string, unknown>): void {
	console.error(JSON.stringify({
		level: "ERROR",
		timestamp: new Date().toISOString(),
		message,
		errorMessage: error instanceof Error ? error.message : String(error),
		errorStack: error instanceof Error ? error.stack : undefined,
		...data
	}));
}

/**
 * SQSレコードから必要な情報だけを抽出する
 */
function extractRecordInfo(record: SQSRecord): Record<string, unknown> {
	return {
		messageId: record.messageId,
		eventSource: record.eventSource,
		eventSourceARN: record.eventSourceARN,
		awsRegion: record.awsRegion,
		attributes: record.attributes,
		// 大きなボディは含めない
		bodySize: record.body ? record.body.length : 0,
		// ボディの先頭部分だけをプレビューとして含める（必要な場合）
		bodyPreview: record.body ? `${record.body.substring(0, 100)}${record.body.length > 100 ? '...' : ''}` : null,
	};
}

/**
 * SQSからメッセージを受け取り、SESでメールを送信するLambda関数
 * メッセージの内容をメール本文として、添付ファイルを生成して送信する
 * AWS SDK v3とnodemailerを使用して実装
 */
export const handler: SQSHandler = async (event: SQSEvent) => {
	logInfo("Lambda invoked", {
		recordCount: event.Records.length,
		recordIds: event.Records.map(r => r.messageId)
	});

	// AWS SDK v3でSESクライアントを初期化
	const sesClient = new SESClient({ region: process.env.AWS_REGION || "ap-northeast-1" });
	
	// nodemailerのSESトランスポートを作成
	const transporter = createSesTransport(sesClient);

	for (const record of event.Records) {
		try {
			logInfo("Processing record", extractRecordInfo(record));

			// SQSメッセージの内容を取得
			const messageBody = record.body;
			
			if (!messageBody) {
				logError("Empty message body", null, { messageId: record.messageId });
				continue;
			}

			// メッセージの内容から添付ファイルを生成
			const attachmentContent = generateAttachmentFromMessage(messageBody);

			// 送信元・送信先メールアドレス
			// 注: 実際の運用では環境変数やSecretsManagerから取得するべき
			const sourceEmail = "phasetr@gmail.com"; // SESで検証済みのアドレスが必要
			const destinationEmail = "phasetr@gmail.com"; // 送信先アドレス

			// メール送信
			await sendEmailWithAttachment(
				transporter,
				sourceEmail,
				destinationEmail,
				"SQSから受信したメッセージ",
				messageBody,
				attachmentContent,
			);

			logInfo("Email sent successfully", { 
				messageId: record.messageId,
				sourceEmail,
				destinationEmail,
				attachmentSize: attachmentContent.length
			});
		} catch (error) {
			logError("Error processing record", error, { messageId: record.messageId });
			// エラーが発生しても他のメッセージの処理を続行
		}
	}
};

/**
 * AWS SDK v3のSESClientを使用してnodemailerのトランスポートを作成する
 */
function createSesTransport(sesClient: SESClient): Transporter {
	return createTransport({
		SES: { 
			ses: sesClient, 
			aws: { SendRawEmailCommand } 
		}
	});
}

/**
 * メッセージの内容から添付ファイルを生成する
 * 大きなメッセージの場合は、サイズを制限する
 */
function generateAttachmentFromMessage(message: string): Buffer {
	logInfo("Generating attachment", { messageSize: message.length });
	
	// メッセージサイズが大きい場合は制限する（例: 100KB以上）
	const MAX_ATTACHMENT_SIZE = 100 * 1024; // 100KB
	
	if (message.length > MAX_ATTACHMENT_SIZE) {
		logInfo("Message size exceeds limit, truncating", { 
			originalSize: message.length,
			limitSize: MAX_ATTACHMENT_SIZE
		});
		
		// メッセージの先頭部分を使用し、切り詰められたことを示す注記を追加
		const truncatedMessage = `${message.substring(0, MAX_ATTACHMENT_SIZE)}
\n\n[... メッセージが大きすぎるため、一部のみ表示しています ...]`;
		
		return Buffer.from(truncatedMessage, "utf-8");
	}
	
	// 通常のケース: メッセージ全体を使用
	return Buffer.from(message, "utf-8");
}

/**
 * nodemailerを使用して添付ファイル付きのメールを送信する
 * 最適化: 大きなメッセージの場合は本文を要約し、添付ファイルとして送信
 */
async function sendEmailWithAttachment(
	transporter: Transporter,
	sourceEmail: string,
	destinationEmail: string,
	subject: string,
	body: string,
	attachmentContent: Buffer,
): Promise<void> {
	// 添付ファイル名 - 拡張子を明示的に.txtに
	const attachmentFilename = `message-${Date.now()}.txt`;
	
	// 本文が大きい場合は要約する
	const MAX_BODY_SIZE = 10 * 1024; // 10KB
	let emailBody = body;
	
	if (body.length > MAX_BODY_SIZE) {
		logInfo("Email body size exceeds limit, summarizing", { 
			originalSize: body.length,
			limitSize: MAX_BODY_SIZE
		});
		
		// 本文を要約（先頭部分を使用）
		emailBody = `${body.substring(0, MAX_BODY_SIZE)}
\n\n[... 本文が大きすぎるため、一部のみ表示しています。添付ファイルに完全な内容が含まれています ...]`;
	}

	// nodemailerのメールオプションを設定
	const mailOptions: MailOptions = {
		from: sourceEmail,
		to: destinationEmail,
		subject: subject,
		text: emailBody,
		attachments: [
			{
				filename: attachmentFilename,
				content: attachmentContent,
				contentType: 'text/plain',
			},
		],
	};

	logInfo("Preparing email with attachment", {
		sourceEmail,
		destinationEmail,
		subject,
		originalBodySize: body.length,
		emailBodySize: emailBody.length,
		attachmentSize: attachmentContent.length,
		attachmentFilename,
	});

	try {
		// nodemailerを使用してメールを送信
		const info = await transporter.sendMail(mailOptions);
		
		logInfo("Email sent successfully", {
			sourceEmail,
			destinationEmail,
			subject,
			messageId: info.messageId,
		});
	} catch (error) {
		logError("Failed to send email", error, {
			sourceEmail,
			destinationEmail,
			subject,
		});
		throw error; // 呼び出し元で処理できるようにエラーを再スロー
	}
}
