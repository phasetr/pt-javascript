# Cloudflare Queuesの動作確認方法

Cloudflare Queuesを使用したメール送信機能の動作確認方法について説明します。

## キューへの追加を確認する方法

### 1. APIレスポンスの確認

`/queue-email`エンドポイントにリクエストを送信すると、以下のようなレスポンスが返されます：

```json
{
  "success": true,
  "messageId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "queued": true,
  "message": "メールがキューに追加されました"
}
```

このレスポンスの`success`が`true`で、`queued`が`true`であれば、メッセージがキューに正常に追加されたことを示します。`messageId`はキュー内のメッセージを一意に識別するIDです。

### 2. Cloudflare Workersのログを確認

Cloudflare Workersのログを確認することで、キューへのメッセージの追加と処理を確認できます。

```bash
# ローカル開発環境でのログ確認
# wrangler devを実行しているターミナルでログが表示されます

# Cloudflare上でのログ確認
wrangler tail
```

キューへのメッセージ追加時には以下のようなログが表示されます：

```txt
[queue] Message added to queue: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

キューからのメッセージ処理時には以下のようなログが表示されます：

```txt
メッセージ処理開始: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
メール送信成功: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx, MessageId: yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
```

### 3. Cloudflareダッシュボードでの確認

Cloudflareのダッシュボードでキューの状態を確認できます。

1. Cloudflareダッシュボードにログイン
2. Workers & Pagesセクションに移動
3. 対象のWorkerを選択
4. Queuesタブを選択

ここで、キューの状態（メッセージ数、処理状況など）を確認できます。

### 4. テストスクリプトの拡張

テストスクリプトを拡張して、キューへの追加が成功したことを確認できます。以下は、`test-queue-email-api.ts`を拡張した例です：

```typescript
// packages/hono-api/src/test-queue-email-api.ts の一部を拡張

// キューへの追加が成功したことを確認
if (response.ok && data.success) {
  console.log("メッセージがキューに追加されました");
  console.log(`メッセージID: ${data.messageId}`);
  console.log(`メッセージ: ${data.message}`);
  
  // キューの処理を待機（オプション）
  console.log("キューの処理を待機中...");
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // ヘルスチェックエンドポイントを呼び出して、サーバーの状態を確認
  const healthResponse = await fetch(`${apiBaseUrl}/health`);
  const healthData = await healthResponse.json();
  console.log("サーバーの状態:", healthData);
}
```

## キューの処理を確認する方法

キューの処理が正常に行われたことを確認するには、以下の方法があります：

### 1. ログの確認

キューコンシューマーがメッセージを処理すると、以下のようなログが表示されます：

```txt
メッセージ処理開始: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
メール送信成功: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx, MessageId: yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
```

### 2. メールの受信確認

最終的には、指定したメールアドレスにメールが届いていることを確認します。メールの件名と本文に、キューに追加した内容が含まれていることを確認してください。

### 3. Cloudflareダッシュボードでの確認方法

CloudflareダッシュボードのQueuesタブで、処理済みメッセージ数や失敗メッセージ数を確認できます。

## トラブルシューティング

### キューへの追加は成功するがメールが届かない場合

1. Cloudflare Workersのログを確認して、エラーメッセージがないか確認します。
2. AWS SNSの設定を確認します。
3. AWS認証情報が正しく設定されているか確認します。

### キューへの追加に失敗する場合

1. Cloudflare Workersのログを確認して、エラーメッセージを確認します。
2. wrangler.jsonc のキュー設定が正しいか確認します。
3. ローカル開発環境の場合、wrangler devが正常に起動しているか確認します。

### キューの処理に失敗する場合

1. Cloudflare Workersのログを確認して、エラーメッセージを確認します。
2. AWS SNSの設定を確認します。
3. AWS認証情報が正しく設定されているか確認します。
4. キューコンシューマーの実装に問題がないか確認します。

## 開発環境とプロダクション環境での違い

ローカル開発環境（wrangler dev）とCloudflare上の環境では、キューの動作に若干の違いがあります：

1. **ローカル開発環境**:
   - キューは実際のCloudflare Queuesではなく、メモリ内でシミュレートされます。
   - キューコンシューマーは同じプロセス内で実行されます。
   - 再起動するとキュー内のメッセージはすべて失われます。

2. **Cloudflare上の環境**:
   - 実際のCloudflare Queuesが使用されます。
   - キューコンシューマーは別のWorkerインスタンスで実行される場合があります。
   - キュー内のメッセージは永続化され、Workerの再起動後も保持されます。
