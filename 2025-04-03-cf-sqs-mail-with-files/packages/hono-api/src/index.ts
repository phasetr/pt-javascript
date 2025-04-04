import { Hono } from "hono";

// CloudflareのBindings型を拡張してAWS関連の設定を追加
interface CloudflareBindings {
  // Cloudflare Secretsで設定する環境変数
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  SQS_QUEUE_URL: string;
}

const app = new Hono<{ Bindings: CloudflareBindings }>();

// ルートパス
app.get("/", (c) => {
  return c.text("CSMWF API - Cloudflare SQS Mail With Files");
});

// メッセージ送信エンドポイント
app.post("/message", async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body.message) {
      return c.json({ error: "メッセージが必要です" }, 400);
    }
    
    // SQSにメッセージを送信
    const result = await sendMessageToSQS(
      c.env.AWS_REGION,
      c.env.AWS_ACCESS_KEY_ID,
      c.env.AWS_SECRET_ACCESS_KEY,
      c.env.SQS_QUEUE_URL,
      body.message
    );
    
    return c.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error("Error sending message:", error);
    return c.json({ error: "メッセージの送信に失敗しました" }, 500);
  }
});

// テスト用のメッセージエンドポイント
app.get("/message", (c) => {
  return c.json({
    message: "テストメッセージです。POSTリクエストを使用してメッセージを送信してください。",
    example: {
      method: "POST",
      url: "/message",
      body: { message: "送信したいメッセージ" }
    }
  });
});

/**
 * SQSにメッセージを送信する関数
 */
async function sendMessageToSQS(
  region: string,
  accessKeyId: string,
  secretAccessKey: string,
  queueUrl: string,
  message: string
): Promise<{ messageId: string }> {
  // AWS SQS APIエンドポイント
  const endpoint = `https://sqs.${region}.amazonaws.com`;
  
  // 現在の日時（ISO形式）
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.substring(0, 8);
  
  // リクエストボディ
  const requestBody = new URLSearchParams({
    Action: "SendMessage",
    MessageBody: message,
    QueueUrl: queueUrl,
    Version: "2012-11-05"
  }).toString();
  
  // AWS SigV4署名の作成
  const signature = await createSignatureV4(
    "POST",
    endpoint,
    "/",
    requestBody,
    region,
    accessKeyId,
    secretAccessKey,
    date,
    amzDate,
    "sqs"
  );
  
  // SQS APIにリクエスト送信
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Amz-Date": amzDate,
      "Authorization": signature,
      "Host": `sqs.${region}.amazonaws.com`
    },
    body: requestBody
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SQS API error: ${response.status} ${errorText}`);
  }
  
  const responseText = await response.text();
  
  // XMLレスポンスからメッセージIDを抽出（簡易的な実装）
  const messageIdMatch = responseText.match(/<MessageId>(.*?)<\/MessageId>/);
  const messageId = messageIdMatch ? messageIdMatch[1] : "unknown";
  
  return { messageId };
}

/**
 * AWS SigV4署名を作成する関数
 */
async function createSignatureV4(
  method: string,
  endpoint: string,
  path: string,
  body: string,
  region: string,
  accessKeyId: string,
  secretAccessKey: string,
  date: string,
  amzDate: string,
  service: string
): Promise<string> {
  // 正規リクエストの作成
  const canonicalRequest = [
    method,
    path,
    "",
    "content-type:application/x-www-form-urlencoded",
    `host:sqs.${region}.amazonaws.com`,
    `x-amz-date:${amzDate}`,
    "",
    "content-type;host;x-amz-date",
    await sha256(body)
  ].join("\n");
  
  // 署名文字列の作成
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    `${date}/${region}/${service}/aws4_request`,
    await sha256(canonicalRequest)
  ].join("\n");
  
  // 署名キーの導出
  const kDate = await hmacSha256(`AWS4${secretAccessKey}`, date);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, "aws4_request");
  
  // 署名の計算
  const signature = toHex(await hmacSha256(kSigning, stringToSign));
  
  // 認証ヘッダーの作成
  return `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${date}/${region}/${service}/aws4_request, SignedHeaders=content-type;host;x-amz-date, Signature=${signature}`;
}

/**
 * SHA-256ハッシュを計算する関数
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return toHex(hashBuffer);
}

/**
 * HMAC-SHA256を計算する関数
 */
async function hmacSha256(key: string | ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const keyBuffer = typeof key === "string" ? new TextEncoder().encode(key) : key;
  const messageBuffer = new TextEncoder().encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  return crypto.subtle.sign("HMAC", cryptoKey, messageBuffer);
}

/**
 * ArrayBufferを16進数文字列に変換する関数
 */
function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export default app;
