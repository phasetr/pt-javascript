/**
 * Hono APIのキューを使用したメール送信エンドポイントをテストするスクリプト
 *
 * 使用方法:
 * ```
 * node dist/test-queue-email-api.js <送信先メールアドレス>
 * ```
 */
import * as process from "node:process";
import fetch from "node-fetch";

async function main() {
  // コマンドライン引数からメールアドレスを取得
  const email = process.argv[2];

  if (!email) {
    console.error("送信先メールアドレスを指定してください");
    console.error(
      "使用方法: node dist/test-queue-email-api.js <送信先メールアドレス>",
    );
    process.exit(1);
  }

  // APIのベースURL（デフォルトはローカル開発サーバー）
  const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:8787";
  const endpoint = `${apiBaseUrl}/queue-email`;

  console.log(`キューを使用したメール送信APIを呼び出します: ${endpoint}`);
  console.log(`送信先メールアドレス: ${email}`);

  try {
    // キューを使用したメール送信APIを呼び出す
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        subject: "CCQM Queue API テストメール",
        message: "これはCCQMプロジェクトのHono APIとCloudflare Queuesを使用したテストメールです。\n\nこのメールが正常に届いていれば、キューの設定は正常に機能しています。",
      }),
    });

    const data = await response.json() as {
      success: boolean;
      messageId?: string;
      queued?: boolean;
      message?: string;
      error?: string;
    };

    if (response.ok && data.success) {
      console.log("メッセージがキューに追加されました");
      console.log(`メッセージID: ${data.messageId}`);
      console.log(`メッセージ: ${data.message}`);
    } else {
      console.error("メッセージのキューへの追加に失敗しました");
      console.error(`ステータスコード: ${response.status}`);
      console.error(`エラーメッセージ: ${data.error || "不明なエラー"}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
    process.exit(1);
  }
}

main();
