# 文字起こしデータをキューに載せてメール送信する機能の実装

## 概要

会話の文字起こしデータをSQSキューに載せ、Lambda関数でメール送信する機能を実装しました。文字起こしデータは、JSON形式で構造化されたデータとしてキューに載せられ、Lambda関数で処理されます。

## 実装内容

### 1. メッセージ処理部分の修正

`packages/lambda/src/message.ts` を修正し、文字起こしデータを含むJSONメッセージを処理できるようにしました。

```typescript
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
    emailContent += conversationData.transcription;
    
    // フッター
    emailContent += "\n\nこのメールはCQLM（Cdk Queue Lambda Mail）システムによって自動的に送信されています。";
    
    return emailContent;
  } catch (error) {
    // エラー処理
  }
}
```

### 2. 検証スクリプトの作成

`packages/cqlm/scripts/verify-transcription.ts` を作成し、サンプルの会話データを生成してSNSトピックに発行するスクリプトを実装しました。

```typescript
// サンプルの会話データを生成
const generateSampleTranscription = (): string => {
  const now = new Date();
  const conversationId = `conv-${Math.floor(Math.random() * 10000)}`;
  
  // サンプルの会話内容
  const transcription = `
山田: こんにちは、本日はお時間をいただきありがとうございます。
田中: こちらこそ、お忙しいところありがとうございます。
...
`;

  // 会話データの構造
  const conversationData = {
    conversationId,
    timestamp: now.toISOString(),
    transcription,
    metadata: {
      participants: ["山田太郎", "田中次郎"],
      duration: "00:15:30",
      topic: "新規プロジェクトの打ち合わせ",
    },
  };

  return JSON.stringify(conversationData);
};
```

### 3. package.jsonの更新

ルートの `package.json` に検証スクリプトを実行するためのコマンドを追加しました。

```json
{
  "scripts": {
    "verify:transcription": "cd packages/cqlm && pnpm install && ts-node scripts/verify-transcription.ts"
  }
}
```

## メッセージ形式

文字起こしデータを含むメッセージは、以下のようなJSON形式で構造化されています。

```json
{
  "conversationId": "conv-1234",
  "timestamp": "2025-03-31T09:15:00Z",
  "transcription": "会話の文字起こし内容がここに入ります...",
  "metadata": {
    "participants": ["山田太郎", "田中次郎"],
    "duration": "00:15:30",
    "topic": "新規プロジェクトの打ち合わせ"
  }
}
```

## 使用方法

1. Lambda関数をビルドしてAWSにデプロイする

    ```bash
    pnpm run deploy:dev
    ```

2. 文字起こしデータを含むメッセージを送信して検証する

    ```bash
    pnpm run verify:transcription
    ```

3. メールを確認する

   送信されたメールには、会話のメタデータ（会話ID、参加者、会話時間、日時）と文字起こし内容が含まれています。

## 拡張性

この実装は、以下のような拡張が可能です：

1. **メタデータの追加**: 会話の場所、言語、重要度などの追加情報を含めることができます。
2. **フォーマットの改善**: HTMLメールとして送信し、より読みやすいレイアウトにすることができます。
3. **添付ファイル**: 文字起こしデータをテキストファイルとして添付することができます。
4. **要約機能**: AIを使用して会話の要約を生成し、メール本文に含めることができます。

## 注意点

- SQSメッセージのサイズ制限は256KBです。非常に長い会話の場合は、S3を使用してデータを保存し、S3のリファレンス情報のみをキューに載せる方法を検討してください。
- メール送信には、Amazon SESの制限があります。送信元と送信先のメールアドレスは、SESで検証されている必要があります。
