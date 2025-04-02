/**
 * AWS Utilities for CCQM project
 */
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";

// デフォルト設定
const DEFAULT_REGION = "ap-northeast-1";
const DEFAULT_PREFIX = "CCQM";
const DEFAULT_ENV = "dev";

/**
 * CloudFormationからスタックの出力値を取得する
 * @param outputKey 出力キー
 * @param stackName スタック名
 * @param region AWSリージョン
 * @param accessKeyId AWS認証情報のアクセスキーID（オプション）
 * @param secretAccessKey AWS認証情報のシークレットアクセスキー（オプション）
 * @returns 出力値
 */
export async function getStackOutput(
  outputKey: string,
  stackName = `${DEFAULT_PREFIX}-Stack-${DEFAULT_ENV}`,
  region: string = DEFAULT_REGION,
  accessKeyId?: string,
  secretAccessKey?: string,
): Promise<string> {
  // CloudFormationクライアントの設定
  const clientOptions: { region: string; credentials?: { accessKeyId: string; secretAccessKey: string } } = { region };

  // AWS認証情報が指定されている場合は設定
  if (accessKeyId && secretAccessKey) {
    clientOptions.credentials = {
      accessKeyId,
      secretAccessKey,
    };
  }

  // CloudFormationクライアントを作成
  const client = new CloudFormationClient(clientOptions);
  const command = new DescribeStacksCommand({
    StackName: stackName,
  });

  try {
    const response = await client.send(command);
    const stack = response.Stacks?.[0];
    if (!stack) {
      throw new Error(`Stack ${stackName} not found`);
    }

    const output = stack.Outputs?.find((output) =>
      output.OutputKey === outputKey
    );
    if (!output || !output.OutputValue) {
      throw new Error(`Output ${outputKey} not found in stack ${stackName}`);
    }

    return output.OutputValue;
  } catch (error) {
    console.error("Error getting stack output:", error);
    throw error;
  }
}

/**
 * SNSトピックのARNを取得する
 * @param environment 環境名
 * @param region AWSリージョン
 * @param accessKeyId AWS認証情報のアクセスキーID（オプション）
 * @param secretAccessKey AWS認証情報のシークレットアクセスキー（オプション）
 * @returns SNSトピックのARN
 */
export async function getEmailTopicArn(
  environment: string = DEFAULT_ENV,
  region: string = DEFAULT_REGION,
  accessKeyId?: string,
  secretAccessKey?: string,
): Promise<string> {
  const stackName = `${DEFAULT_PREFIX}-Stack-${environment}`;
  return getStackOutput("EmailTopicArn", stackName, region, accessKeyId, secretAccessKey);
}

/**
 * SNSを使用してメールを送信する
 * @param email 送信先メールアドレス
 * @param subject メールの件名
 * @param message メールの本文
 * @param topicArn SNSトピックのARN
 * @param region AWSリージョン
 * @param accessKeyId AWS認証情報のアクセスキーID（オプション）
 * @param secretAccessKey AWS認証情報のシークレットアクセスキー（オプション）
 * @returns 送信結果
 */
export async function sendEmail(
  email: string,
  subject: string,
  message: string,
  topicArn?: string,
  region: string = DEFAULT_REGION,
  accessKeyId?: string,
  secretAccessKey?: string,
): Promise<{ success: boolean; messageId?: string; error?: any }> {
  // トピックARNが指定されていない場合は取得する
  const actualTopicArn = topicArn ||
    await getEmailTopicArn(DEFAULT_ENV, region, accessKeyId, secretAccessKey);

  // SNSクライアントの設定
  const clientOptions: { region: string; credentials?: { accessKeyId: string; secretAccessKey: string } } = { region };

  // AWS認証情報が指定されている場合は設定
  if (accessKeyId && secretAccessKey) {
    clientOptions.credentials = {
      accessKeyId,
      secretAccessKey,
    };
  }

  // SNSクライアントを作成
  const client = new SNSClient(clientOptions);

  // 日本時間の現在時刻を取得
  const now = new Date();
  const jstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString()
    .replace("T", " ").substring(0, 19);

  // 件名と本文に日本時間を追加
  const emailSubject = `${subject} (送信時刻: ${jstTime})`;
  const emailMessage = `${message}\n\n送信時刻: ${jstTime}`;

  try {
    const command = new PublishCommand({
      TopicArn: actualTopicArn,
      Message: emailMessage,
      Subject: emailSubject,
      MessageAttributes: {
        email: {
          DataType: "String",
          StringValue: email,
        },
      },
    });

    const response = await client.send(command);
    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error,
    };
  }
}

export default {
  getStackOutput,
  getEmailTopicArn,
  sendEmail,
};
