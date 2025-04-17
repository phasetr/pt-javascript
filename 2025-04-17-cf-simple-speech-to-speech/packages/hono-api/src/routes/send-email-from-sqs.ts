/**
 * メール送信エンドポイントのハンドラー
 */
import { DEFAULT_EMAIL } from "common";
import type { Context } from "hono";
import { DEFAULT_REGION, getStackOutput, sendMessageToSQS } from "../utils/aws";

// 定数
const MAX_EMAIL_SIZE = 10 * 1024; // 10KB
const MAX_ATTACHMENT_SIZE = 200 * 1024; // 200KB

/**
 * メール送信エンドポイントのハンドラー関数
 * テキストデータをメールとして送信します
 */
export const sendEmailFromSqsHandler = async (c: Context) => {
	try {
		// リクエストボディを取得
		const body = await c.req.json();

		// 必須パラメータの検証
		const text = body.text;
		if (!text) {
			return c.json({ error: "Text is required" }, 400);
		}

		// オプションパラメータの取得
		const to = body.to || DEFAULT_EMAIL;
		const environment = body.environment || "dev";
		const region = body.region || DEFAULT_REGION;

		// AWS認証情報を取得
		const env = c.env as {
			AWS_ACCESS_KEY_ID?: string;
			AWS_SECRET_ACCESS_KEY?: string;
		};
		const credentials =
			env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
				? {
						accessKeyId: env.AWS_ACCESS_KEY_ID,
						secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
					}
				: undefined;

		// スタック名
		const stackName = `CwhdtStack-${environment}`;

		// SQSキューのURLを取得
		const queueUrl = await getStackOutput(
			stackName,
			"QueueUrl",
			region,
			credentials,
		);

		// 送信元メールアドレスを取得
		const from = await getStackOutput(
			stackName,
			"EmailSender",
			region,
			credentials,
		);

		// 現在の日本時間を取得
		const now = new Date();
		const nowStr = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
		const subject = body.subject || `Hono API メール送信テスト [${nowStr}]`;

		// 添付ファイル名を生成（日付-時刻.txt形式、Asia/Tokyoタイムゾーン）
		const dateTime = now
			.toLocaleString("ja-JP", {
				timeZone: "Asia/Tokyo",
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
				hour12: false,
			})
			.replace(/\//g, "-")
			.replace(/[,:\s]/g, "-")
			.replace(/--/g, "-");
		const attachmentFilename = body.attachmentFilename || `${dateTime}.txt`;

		// テキストが200KBを超える場合は切り詰める
		let attachmentData = text;
		let truncatedAttachment = false;
		if (text.length > MAX_ATTACHMENT_SIZE) {
			attachmentData = text.substring(0, MAX_ATTACHMENT_SIZE);
			truncatedAttachment = true;
		}

		// メール本文を作成（10KBまで）
		let emailText = "";
		let truncatedEmail = false;
		if (text.length > MAX_EMAIL_SIZE) {
			emailText = text.substring(0, MAX_EMAIL_SIZE);
			emailText += "\n\n...(続きは添付ファイルをご確認ください)...";
			truncatedEmail = true;
		} else {
			emailText = text;
		}

		// 添付ファイルが切り詰められた場合は注意書きを追加
		if (truncatedAttachment) {
			emailText +=
				"\n\n注意: 添付ファイルは元のデータの最初の200KBのみを含んでいます。";
		}

		// リクエスト元の情報を取得
		const requestInfo = {
			ip:
				c.req.header("CF-Connecting-IP") ||
				c.req.header("X-Forwarded-For") ||
				"unknown",
			userAgent: c.req.header("User-Agent") || "unknown",
			timestamp: new Date().toISOString(),
			requestId: c.req.header("X-Request-ID") || crypto.randomUUID(),
			path: c.req.path,
			method: c.req.method,
		};

		console.log("Request info:", JSON.stringify(requestInfo));

		// メッセージ本文を作成
		const messageBody = JSON.stringify({
			from,
			to,
			subject,
			text: emailText,
			attachmentData,
			attachmentFilename,
			requestInfo, // リクエスト元の情報を追加
		});

		// SQSキューにメッセージを送信
		const messageId = await sendMessageToSQS(
			queueUrl,
			messageBody,
			region,
			credentials,
		);

		// 成功レスポンスを返す
		return c.json({
			success: true,
			message: "Email request sent successfully",
			details: {
				messageId,
				from,
				to,
				subject,
				textLength: emailText.length,
				attachmentName: attachmentFilename,
				attachmentSize: attachmentData.length,
				emailTruncated: truncatedEmail,
				attachmentTruncated: truncatedAttachment,
			},
		});
	} catch (error) {
		console.error("Error sending email:", error);
		return c.json(
			{
				success: false,
				error: error instanceof Error ? error.message : String(error),
			},
			500,
		);
	}
};
