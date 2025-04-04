// node-fetch v3はESMのみをサポートしているため、ダイナミックインポートを使用
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetch = (url: string, init?: any) =>
	import("node-fetch").then(({ default: fetch }) => fetch(url, init));
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Honoアプリケーションを通じてSQSにメッセージを送信するテストスクリプト
 * 約200KBのメッセージをHonoアプリケーションに送信し、SQS→Lambda→SESの流れを検証する
 */
async function testHonoApi(apiUrlArg?: string) {
	try {
		// APIのエンドポイント
		// コマンドライン引数 > 環境変数 > デフォルト値 の順で決定
		const apiUrl = apiUrlArg || "http://localhost:8787/message";

		console.log(`Using API URL: ${apiUrl}`);

		// クライアントとサーバーの会話データを読み込む
		const conversationPath = path.join(
			__dirname,
			"client-server-conversation.txt",
		);
		const messageContent = fs.readFileSync(conversationPath, "utf-8");

		console.log(`Message size: ${Buffer.from(messageContent).length} bytes`);
		console.log(`Sending message to: ${apiUrl}`);

		// APIにPOSTリクエストを送信
		const response = await fetch(apiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ message: messageContent }),
		});

		// レスポンスを処理
		const result = (await response.json()) as {
			success?: boolean;
			messageId?: string;
			error?: string;
		};

		if (response.ok) {
			console.log("Message sent successfully through Hono API!");
			console.log("Response:", result);

			if (result.messageId) {
				console.log("MessageId:", result.messageId);
			}
		} else {
			console.error("Failed to send message:", result.error || "Unknown error");
			process.exit(1);
		}
	} catch (error) {
		console.error("Error sending message through Hono API:", error);
		process.exit(1);
	}
}

// コマンドライン引数からAPIのURLを取得
const apiUrlArg = process.argv[2];

// スクリプト実行
testHonoApi(apiUrlArg)
	.then(() => console.log("Test completed"))
	.catch((error) => {
		console.error("Test failed:", error);
		process.exit(1);
	});
