/**
 * SNSを使用したメール送信テストスクリプト
 *
 * 使用方法:
 * ```
 * node dist/send-test-email.js <送信先メールアドレス>
 * ```
 */
import { sendEmail } from "./index.js";
import * as process from "node:process";

async function main() {
  // コマンドライン引数からメールアドレスを取得
  const email = process.argv[2];

  if (!email) {
    console.error("送信先メールアドレスを指定してください");
    console.error(
      "使用方法: node dist/send-test-email.js <送信先メールアドレス>",
    );
    process.exit(1);
  }

  console.log(`メールを送信します: ${email}`);

  try {
    // メールを送信
    const result = await sendEmail(
      email,
      "CCQM テストメール",
      "これはCCQMプロジェクトのSNSを使用したテストメールです。\n\nこのメールが正常に届いていれば、SNSの設定は正常に機能しています。",
    );

    if (result.success) {
      console.log("メールの送信に成功しました");
      console.log(`メッセージID: ${result.messageId}`);
    } else {
      console.error("メールの送信に失敗しました");
      console.error(result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
    process.exit(1);
  }
}

main();
