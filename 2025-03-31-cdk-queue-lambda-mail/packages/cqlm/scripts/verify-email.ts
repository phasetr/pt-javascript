#!/usr/bin/env node
import { SESClient, VerifyEmailIdentityCommand, ListIdentitiesCommand, GetIdentityVerificationAttributesCommand } from '@aws-sdk/client-ses';

// 環境変数から取得するか、コマンドライン引数から取得する
const region = process.env.AWS_REGION || 'ap-northeast-1';

// SESクライアントの初期化
const sesClient = new SESClient({ region });

// 検証するメールアドレスのリスト
const emailAddresses = [
  'phasetr+sender@gmail.com',  // 送信元メールアドレス
  'phasetr+sample1@gmail.com', // 送信先メールアドレス1
  'phasetr+sample2@gmail.com',  // 送信先メールアドレス2
  'phasetr@gmail.com',         // 送信先メールアドレス3
  'yosiqftqsm@gmail.com',         // 送信先メールアドレス4
];

// メールアドレスを検証する
async function verifyEmailAddress(email: string): Promise<void> {
  try {
    const command = new VerifyEmailIdentityCommand({
      EmailAddress: email
    });
    await sesClient.send(command);
    console.log(`検証メールを送信しました: ${email}`);
    console.log('メールを確認して、検証リンクをクリックしてください。');
  } catch (error) {
    console.error(`メールアドレスの検証リクエスト中にエラーが発生しました: ${email}`, error);
    throw error;
  }
}

// 検証済みのメールアドレスのリストを取得する
async function listVerifiedEmailAddresses(): Promise<string[]> {
  try {
    const command = new ListIdentitiesCommand({
      IdentityType: 'EmailAddress'
    });
    const response = await sesClient.send(command);
    return response.Identities || [];
  } catch (error) {
    console.error('検証済みメールアドレスの取得中にエラーが発生しました', error);
    throw error;
  }
}

// メールアドレスの検証ステータスを取得する
async function getEmailVerificationStatus(emails: string[]): Promise<Record<string, string>> {
  if (emails.length === 0) {
    return {};
  }

  try {
    const command = new GetIdentityVerificationAttributesCommand({
      Identities: emails
    });
    const response = await sesClient.send(command);
    
    const result: Record<string, string> = {};
    if (response.VerificationAttributes) {
      for (const email of emails) {
        const attr = response.VerificationAttributes[email];
        result[email] = attr?.VerificationStatus || 'NotFound';
      }
    }
    
    return result;
  } catch (error) {
    console.error('メールアドレスの検証ステータスの取得中にエラーが発生しました', error);
    throw error;
  }
}

// メイン関数
async function main(): Promise<void> {
  try {
    // コマンドライン引数を解析
    const args = process.argv.slice(2);
    const checkOnly = args.includes('--check');
    
    // 検証済みのメールアドレスを取得
    const verifiedEmails = await listVerifiedEmailAddresses();
    console.log('検証済みのメールアドレス:', verifiedEmails);
    
    // 検証ステータスを取得
    const verificationStatus = await getEmailVerificationStatus(verifiedEmails);
    console.log('検証ステータス:', verificationStatus);
    
    // 未検証のメールアドレスを特定
    const unverifiedEmails = emailAddresses.filter(email => 
      !verifiedEmails.includes(email) || 
      verificationStatus[email] !== 'Success'
    );
    
    if (unverifiedEmails.length === 0) {
      console.log('すべてのメールアドレスが検証済みです。');
      return;
    }
    
    console.log('未検証のメールアドレス:', unverifiedEmails);
    
    if (checkOnly) {
      console.log('--checkオプションが指定されているため、検証リクエストは送信しません。');
      return;
    }
    
    // 未検証のメールアドレスに検証リクエストを送信
    for (const email of unverifiedEmails) {
      await verifyEmailAddress(email);
    }
    
    console.log('\n検証プロセスを開始しました。');
    console.log('各メールアドレスに検証メールが送信されました。');
    console.log('メールを確認して、検証リンクをクリックしてください。');
    console.log('\n検証ステータスを確認するには、以下のコマンドを実行してください:');
    console.log('pnpm run verify:email --check');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトの実行
if (require.main === module) {
  main().catch(error => {
    console.error('未処理のエラー:', error);
    process.exit(1);
  });
}
