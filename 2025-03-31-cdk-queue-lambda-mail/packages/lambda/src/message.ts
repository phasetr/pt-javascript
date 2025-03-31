/**
 * 会話データの型定義
 */
interface ConversationData {
  conversationId?: string;
  timestamp?: string;
  transcription: string;
  metadata?: {
    participants?: string[];
    duration?: string;
    topic?: string;
    [key: string]: unknown;
  };
}

/**
 * 受け取ったメッセージを処理してメール本文を作成する
 * @param messageBody SQSから受け取ったメッセージ本文
 * @returns 加工されたメール本文
 */
export function processMessage(messageBody: string): string {
	try {
		// メッセージをパースして会話データを取得
		let conversationData: ConversationData;
		
		try {
			// JSONとしてパースを試みる
			const parsedBody = JSON.parse(messageBody);
			
			if (typeof parsedBody === "string") {
				// 文字列の場合は単純な文字起こしとして扱う
				conversationData = { transcription: parsedBody };
			} else if (parsedBody.transcription) {
				// 構造化されたデータの場合
				conversationData = parsedBody;
			} else {
				// transcriptionフィールドがない場合はそのままJSONを文字列化
				conversationData = { transcription: JSON.stringify(parsedBody, null, 2) };
			}
		} catch (e) {
			// JSONでない場合はそのまま文字起こしとして扱う
			conversationData = { transcription: messageBody };
		}
		
		// 現在の日時を取得
		const now = new Date();
		const formattedDate = now.toLocaleString("ja-JP", {
			timeZone: "Asia/Tokyo",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
		
		// メール本文を構築
		let emailContent = "";
		
		// ヘッダー部分（メタデータ）
		if (conversationData.conversationId) {
			emailContent += `会話ID: ${conversationData.conversationId}\n`;
		}
		
		if (conversationData.metadata?.participants) {
			emailContent += `参加者: ${conversationData.metadata.participants.join(', ')}\n`;
		}
		
		if (conversationData.metadata?.duration) {
			emailContent += `会話時間: ${conversationData.metadata.duration}\n`;
		}
		
		// タイムスタンプ（メッセージ内のものか現在時刻）
		const timestamp = conversationData.timestamp 
			? new Date(conversationData.timestamp).toLocaleString("ja-JP")
			: formattedDate;
		emailContent += `日時: ${timestamp}\n\n`;
		
		// 区切り線
		emailContent += `${"=".repeat(50)}\n\n`;
		
		// 文字起こし本文
		emailContent += `${conversationData.transcription}`;
		
		// フッター
		emailContent += "\n\nこのメールはCQLM（Cdk Queue Lambda Mail）システムによって自動的に送信されています。";
		
		return emailContent;
	} catch (error) {
		console.error("Error processing message:", error);
		throw new Error(
			`メッセージの処理中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
