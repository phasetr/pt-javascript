# Cloudflare Queuesのトラブルシューティング

## 問題

Cloudflare Queuesを設定した後、以下のエラーが発生しました：

```
✘ [ERROR] Received a QueueEvent but we lack a handler for QueueEvents. Did you remember to export a queue() function?

✘ [ERROR] Uncaught (async) Error: Handler does not export a queue() function.

✘ [ERROR] Uncaught (async) Error: Handler does not export a queue() function.
```

## 原因

このエラーは、Cloudflare Workersがキューイベントを処理するための`queue()`関数を見つけられないことを示しています。具体的な原因は以下の通りです：

1. Honoフレームワークを使用している場合、`export default app`の後に`export async function queue`を定義していると、ビルドプロセスでキューコンシューマーが正しく出力されない可能性があります。
2. Cloudflare Workersでは、キューコンシューマーのエントリーポイントを明示的に指定する必要があります。

## 解決策

以下の手順で問題を解決しました：

### 1. キューコンシューマーを別ファイルに移動

キューコンシューマーの関数を`index.ts`から別のファイル（`queue-consumer.ts`）に移動しました：

```typescript
// packages/hono-api/src/queue-consumer.ts
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
```

### 2. インポートの問題を修正

TypeScriptのモジュール解決の設定に関連するエラーを修正するために、以下の変更を行いました：

1. 型インポートを明示的に指定（`import type { ... }`）
2. ファイル拡張子を追加（`./index.js`）

### 3. index.ts を更新

index.ts を更新して、queue-consumer.js から queue 関数をエクスポートするようにしました：

```typescript
// キューコンシューマーの実装
export { queue } from './queue-consumer.js';
```

注意: 最初は`wrangler.jsonc`に`entry_point`と`queue_consumer_entry_point`フィールドを追加しましたが、これはワーニングの原因となりました。最新のCloudflare Workersでは、キューコンシューマーの関数は`index.ts`ファイルから直接エクスポートする必要があります。

## 学んだこと

1. Cloudflare Workersでキューコンシューマーを実装する場合、別のファイルに分離することで問題を回避できます。
2. キューコンシューマーのエントリーポイントを明示的に指定することが重要です。
3. TypeScriptのモジュール解決の設定に注意する必要があります（特に拡張子の指定など）。

## 参考資料

- [Cloudflare Queuesのドキュメント](https://developers.cloudflare.com/queues/)
- [Cloudflare WorkersでのTypeScriptの使用](https://developers.cloudflare.com/workers/runtime-apis/typescript/)
