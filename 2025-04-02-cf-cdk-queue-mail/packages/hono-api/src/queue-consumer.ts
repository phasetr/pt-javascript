import { sendEmail } from "aws-utils";
import type { EmailMessage } from "./index.js";

// CloudflareBindingsの型定義
export type QueueEnvironment = {
  AWS_REGION?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
};

// キューからのメッセージを処理する関数
export async function queue(
  batch: MessageBatch<EmailMessage>,
  env: QueueEnvironment
): Promise<void> {
  // バッチ内の各メッセージを処理
  for (const message of batch.messages) {
    try {
      console.log(`メッセージ処理開始: ${message.id}`);
      const { email, subject, message: emailMessage, timestamp } = message.body;

      // 環境変数からリージョンを取得（デフォルトはap-northeast-1）
      const region = env.AWS_REGION || "ap-northeast-1";

      // AWS認証情報を取得
      const accessKeyId = env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = env.AWS_SECRET_ACCESS_KEY;

      // メールを送信
      const result = await sendEmail(
        email,
        subject,
        emailMessage,
        undefined, // SNSトピックARNはCloudFormationから取得
        region,
        accessKeyId,
        secretAccessKey
      );

      if (result.success) {
        console.log(`メール送信成功: ${message.id}, MessageId: ${result.messageId}`);
        // メッセージを正常に処理したことをマーク
        message.ack();
      } else {
        console.error(`メール送信失敗: ${message.id}`, result.error);
        // メッセージの処理に失敗したことをマーク（再試行される）
        message.retry();
      }
    } catch (error) {
      console.error(`メッセージ処理エラー: ${message.id}`, error);
      // エラーが発生した場合は再試行
      message.retry();
    }
  }
}
