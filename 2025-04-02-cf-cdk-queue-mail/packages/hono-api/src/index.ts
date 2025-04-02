import { Hono } from "hono";
import { cors } from "hono/cors";
import { sendEmail } from "aws-utils";

// CloudflareBindingsの型定義を拡張
type CloudflareBindings = {
  // 必要に応じてCloudflareの環境変数やシークレットを追加
  AWS_REGION?: string;
  AWS_STACK_NAME?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  // Cloudflare Queuesのバインディング
  EMAIL_QUEUE: Queue<EmailMessage>;
};

// メールメッセージの型定義
export type EmailMessage = {
  email: string;
  subject: string;
  message: string;
  timestamp: string;
};

const app = new Hono<{ Bindings: CloudflareBindings }>();

// CORSミドルウェアを追加
app.use(cors());

// 基本的なメッセージエンドポイント
app.get("/message", (c) => {
  return c.text("Hello Hono!");
});


// メール送信エンドポイント（直接送信）
app.post("/send-email", async (c) => {
  try {
    // リクエストボディからデータを取得
    const { email, subject, message } = await c.req.json<{
      email: string;
      subject: string;
      message: string;
    }>();

    // バリデーション
    if (!email || !subject || !message) {
      return c.json(
        {
          success: false,
          error: "メールアドレス、件名、本文は必須です",
        },
        400
      );
    }

    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json(
        {
          success: false,
          error: "無効なメールアドレス形式です",
        },
        400
      );
    }

    // 環境変数からリージョンを取得（デフォルトはap-northeast-1）
    const region = c.env.AWS_REGION || "ap-northeast-1";

    // AWS認証情報を取得
    const accessKeyId = c.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = c.env.AWS_SECRET_ACCESS_KEY;

    // メールを送信（SNSトピックARNはCloudFormationから取得）
    const result = await sendEmail(
      email,
      subject,
      message,
      undefined, // SNSトピックARNはCloudFormationから取得
      region,
      accessKeyId,
      secretAccessKey
    );

    if (result.success) {
      return c.json({
        success: true,
        messageId: result.messageId,
      });
    }
    
    console.error("メール送信エラー:", result.error);
    return c.json(
      {
        success: false,
        error: "メールの送信に失敗しました",
      },
      500
    );
  } catch (error) {
    console.error("エラーが発生しました:", error);
    return c.json(
      {
        success: false,
        error: "サーバーエラーが発生しました",
      },
      500
    );
  }
});

// キューを使用したメール送信エンドポイント
app.post("/queue-email", async (c) => {
  try {
    // リクエストボディからデータを取得
    const { email, subject, message } = await c.req.json<{
      email: string;
      subject: string;
      message: string;
    }>();

    // バリデーション
    if (!email || !subject || !message) {
      return c.json(
        {
          success: false,
          error: "メールアドレス、件名、本文は必須です",
        },
        400
      );
    }

    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json(
        {
          success: false,
          error: "無効なメールアドレス形式です",
        },
        400
      );
    }

    // 現在のタイムスタンプを取得
    const timestamp = new Date().toISOString();

    // キューにメッセージを送信
    const messageId = await c.env.EMAIL_QUEUE.send({
      email,
      subject,
      message,
      timestamp,
    });

    return c.json({
      success: true,
      messageId,
      queued: true,
      message: "メールがキューに追加されました",
    });
  } catch (error) {
    console.error("キューへの追加エラー:", error);
    return c.json(
      {
        success: false,
        error: "メールのキューへの追加に失敗しました",
      },
      500
    );
  }
});

// ヘルスチェックエンドポイント
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Honoアプリケーションとキューコンシューマーをエクスポート
export default {
  fetch: app.fetch,
  queue
};

// キューコンシューマーの実装

// キューからのメッセージを処理する関数
export async function queue(
  batch: MessageBatch<EmailMessage>,
  env: {
    AWS_REGION?: string;
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
  }
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
