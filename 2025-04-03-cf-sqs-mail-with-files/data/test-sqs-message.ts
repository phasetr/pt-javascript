import { SQSClient, SendMessageCommand, GetQueueUrlCommand, ListQueuesCommand } from '@aws-sdk/client-sqs';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * SQSにメッセージを送信するテストスクリプト
 * 約200KBのメッセージを送信し、Lambda関数がSESでメールを送信できるか検証する
 */
async function testSendMessage(queueUrlArg?: string) {
  try {
    // 環境変数から認証情報とリージョンを取得
    const region = process.env.AWS_REGION || 'ap-northeast-1';
    let queueUrl = queueUrlArg;

    // キューURLが指定されていない場合は自動検出を試みる
    if (!queueUrl) {
      queueUrl = await detectQueueUrl(region);
    }

    if (!queueUrl) {
      console.error('Error: SQS queue URL could not be determined. Please provide it as an argument.');
      process.exit(1);
    }

    // クライアントとサーバーの会話データを読み込む
    const conversationPath = path.join(__dirname, 'client-server-conversation.txt');
    const messageContent = fs.readFileSync(conversationPath, 'utf-8');
    
    console.log(`Message size: ${Buffer.from(messageContent).length} bytes`);

    // SQSクライアントを初期化
    const sqsClient = new SQSClient({ region });

    // メッセージ送信コマンドを作成
    const sendMessageCommand = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: messageContent,
    });

    // メッセージを送信
    const response = await sqsClient.send(sendMessageCommand);
    
    console.log('Message sent successfully!');
    console.log('MessageId:', response.MessageId);
    console.log('Queue URL:', queueUrl);
    
    return response;
  } catch (error) {
    console.error('Error sending message to SQS:', error);
    throw error;
  }
}

/**
 * SQSキューのURLを自動検出する
 * 1. CloudFormationスタックの出力から検索
 * 2. SQSキュー名から検索
 * 3. SQSキューの一覧から検索
 */
async function detectQueueUrl(region: string): Promise<string | undefined> {
  try {
    console.log('Attempting to auto-detect SQS queue URL...');
    
    // CloudFormationスタックの出力から検索
    try {
      const cfClient = new CloudFormationClient({ region });
      const stackName = 'CSMWF-prod-Stack'; // スタック名
      
      const command = new DescribeStacksCommand({
        StackName: stackName,
      });
      
      const response = await cfClient.send(command);
      const stack = response.Stacks?.[0];
      
      if (stack?.Outputs) {
        const queueUrlOutput = stack.Outputs.find(output => 
          output.OutputKey === 'QueueUrl' || 
          output.OutputKey?.includes('QueueUrl') ||
          output.OutputKey?.includes('Queue')
        );
        
        if (queueUrlOutput?.OutputValue) {
          console.log(`Found queue URL in CloudFormation stack outputs: ${queueUrlOutput.OutputValue}`);
          return queueUrlOutput.OutputValue;
        }
      }
    } catch (error) {
      console.log('Could not find queue URL in CloudFormation stack outputs:', error);
    }
    
    // SQSキュー名から検索
    try {
      const sqsClient = new SQSClient({ region });
      const queueName = 'CSMWF-prod-Queue'; // 想定されるキュー名
      
      const command = new GetQueueUrlCommand({
        QueueName: queueName,
      });
      
      const response = await sqsClient.send(command);
      if (response.QueueUrl) {
        console.log(`Found queue URL by name: ${response.QueueUrl}`);
        return response.QueueUrl;
      }
    } catch (error) {
      console.log('Could not find queue URL by name:', error);
    }
    
    // SQSキューの一覧から検索
    try {
      const sqsClient = new SQSClient({ region });
      const command = new ListQueuesCommand({
        QueueNamePrefix: 'CSMWF',
      });
      
      const response = await sqsClient.send(command);
      if (response.QueueUrls && response.QueueUrls.length > 0) {
        console.log(`Found queue URL in list: ${response.QueueUrls[0]}`);
        return response.QueueUrls[0];
      }
    } catch (error) {
      console.log('Could not find queue URL in list:', error);
    }
    
    console.log('Could not auto-detect SQS queue URL');
    return undefined;
  } catch (error) {
    console.error('Error detecting queue URL:', error);
    return undefined;
  }
}

// コマンドライン引数からキューURLを取得
const queueUrlArg = process.argv[2];

// スクリプト実行
testSendMessage(queueUrlArg)
  .then(() => console.log('Test completed'))
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
