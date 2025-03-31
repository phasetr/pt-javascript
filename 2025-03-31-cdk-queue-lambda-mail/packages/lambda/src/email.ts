import {
	SESClient,
	SendEmailCommand,
	type SendEmailCommandInput,
} from "@aws-sdk/client-ses";

// SESクライアントを初期化
const sesClient = new SESClient({
	region: process.env.AWS_REGION || "ap-northeast-1",
});

// 送信元メールアドレス（SESで検証済みのアドレス）
const SENDER_EMAIL = process.env.SENDER_EMAIL || "no-reply@example.com";

// 送信先メールアドレスのリスト（実際の環境では環境変数から取得するか、DBから取得する）
const RECIPIENT_EMAILS = [
	"phasetr@gmail.com",
	// "phasetr+sample1@gmail.com",
	// "phasetr+sample2@gmail.com",
	"yoshitsugu.sekine@offisis.co.jp",
	"yosiqftqsm@gmail.com",
	// 実際の送信先メールアドレスに置き換える
];

/**
 * ランダムに送信先メールアドレスを選択する
 * @returns 選択されたメールアドレス
 */
function getRandomRecipient(): string {
	const index = Math.floor(Math.random() * RECIPIENT_EMAILS.length);
	return RECIPIENT_EMAILS[index];
}

/**
 * メールを送信する
 * @param content メール本文
 * @returns 送信結果
 */
export async function sendEmail(
	content: string,
): Promise<{ messageId: string; recipient: string }> {
	// 送信先をランダムに選択
	const recipient = getRandomRecipient();
	console.log(`👺Selected recipient: ${recipient}`);

	// 現在の日時を取得（件名用）
	const now = new Date();
	const formattedDate = now.toLocaleString("ja-JP", {
		timeZone: "Asia/Tokyo",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});

	// メール送信パラメータを設定
	const params: SendEmailCommandInput = {
		Source: SENDER_EMAIL,
		Destination: {
			ToAddresses: [recipient],
		},
		Message: {
			Subject: {
				Data: `CQLMシステムからの通知 [${formattedDate}]`,
				Charset: "UTF-8",
			},
			Body: {
				Text: {
					Data: content,
					Charset: "UTF-8",
				},
			},
		},
	};

	try {
		// メールを送信
		console.log(`Sending email to ${recipient}`);
		const command = new SendEmailCommand(params);
		const result = await sesClient.send(command);
		console.log("Email sent successfully:", result.MessageId);

		return {
			messageId: result.MessageId || "unknown",
			recipient,
		};
	} catch (error) {
		console.error("Error sending email:", error);
		throw new Error(
			`メール送信中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
