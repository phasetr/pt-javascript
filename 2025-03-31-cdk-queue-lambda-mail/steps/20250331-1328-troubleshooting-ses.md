# Amazon SESのメールアドレス検証エラーのトラブルシューティング

## 問題

Lambda関数の実行時に以下のエラーが発生しました：

```txt
Error: Email address is not verified. The following identities failed the check in region AP-NORTHEAST-1: phasetr+sample2@gmail.com, phasetr+sender@gmail.com
```

## 原因

Amazon SES（Simple Email Service）はデフォルトでサンドボックス環境にあり、以下の制限があります：

1. 送信元メールアドレスと送信先メールアドレスの両方を事前に検証する必要がある
2. 検証されていないメールアドレスに対してメールを送信することはできない
3. 1日あたりの送信数や送信レートに制限がある

今回のエラーは、送信元メールアドレス（<phasetr+sender@gmail.com>）と送信先メールアドレス（<phasetr+sample2@gmail.com>）が検証されていないために発生しました。

## 解決策

SESでメールアドレスを検証するスクリプトを作成しました。このスクリプトは以下の機能を持っています：

1. 検証するメールアドレスのリストを定義
2. 検証済みのメールアドレスのリストを取得
3. 検証ステータスを取得
4. 未検証のメールアドレスに検証リクエストを送信
5. 検証ステータスを確認するオプション（--check）

### 検証手順

1. メールアドレスの検証リクエストを送信する

    ```bash
    pnpm run verify:email
    ```

2. 各メールアドレスに送信された検証メールを確認し、検証リンクをクリックする

3. 検証ステータスを確認する

    ```bash
    pnpm run verify:email:check
    ```

4. すべてのメールアドレスが検証されたら、再度デプロイして動作検証を行う

    ```bash
    pnpm run deploy:dev
    pnpm run verify
    ```

### 検証スクリプトの実装

```typescript
#!/usr/bin/env node
import { SESClient, VerifyEmailIdentityCommand, ListIdentitiesCommand, GetIdentityVerificationAttributesCommand } from '@aws-sdk/client-ses';

// 検証するメールアドレスのリスト
const emailAddresses = [
  'phasetr+sender@gmail.com',  // 送信元メールアドレス
  'phasetr+sample1@gmail.com', // 送信先メールアドレス1
  'phasetr+sample2@gmail.com'  // 送信先メールアドレス2
];

// メールアドレスを検証する
async function verifyEmailAddress(email: string): Promise<void> {
  const command = new VerifyEmailIdentityCommand({
    EmailAddress: email
  });
  await sesClient.send(command);
  console.log(`検証メールを送信しました: ${email}`);
}

// メイン関数
async function main(): Promise<void> {
  // 検証済みのメールアドレスを取得
  const verifiedEmails = await listVerifiedEmailAddresses();
  
  // 未検証のメールアドレスに検証リクエストを送信
  const unverifiedEmails = emailAddresses.filter(email => 
    !verifiedEmails.includes(email) || 
    verificationStatus[email] !== 'Success'
  );
  
  for (const email of unverifiedEmails) {
    await verifyEmailAddress(email);
  }
}
```

## 本番環境での対応

サンドボックス環境から本番環境に移行するには、以下の手順を実行します：

1. AWS Support Centerにアクセスする
2. サポートケースを作成する
3. サービス制限の引き上げをリクエストする
4. SESの本番アクセスをリクエストする

本番環境では、検証済みのドメインからのメール送信のみが必要となり、個別のメールアドレスの検証は不要になります。

## 学んだこと

1. Amazon SESはデフォルトでサンドボックス環境にあり、送信元と送信先のメールアドレスを検証する必要がある
2. AWS SDKを使用して、メールアドレスの検証リクエストを送信できる
3. 検証プロセスは非同期であり、メールの確認とリンクのクリックが必要
4. 本番環境では、ドメイン全体を検証することで、個別のメールアドレスの検証を回避できる
