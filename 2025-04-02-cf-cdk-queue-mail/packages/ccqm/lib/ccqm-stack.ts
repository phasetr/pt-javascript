import { Duration, Stack, type StackProps, CfnOutput } from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import type { Construct } from 'constructs';

// スタックプロパティの拡張
interface CcqmStackProps extends StackProps {
  context?: {
    environment: string;
    prefix: string;
  };
}

export class CcqmStack extends Stack {
  // SNSトピックを外部からアクセスできるようにする
  public readonly emailTopic: sns.Topic;

  constructor(scope: Construct, id: string, props?: CcqmStackProps) {
    super(scope, id, props);

    // 環境とプレフィックスの取得
    const environment = props?.context?.environment || 'dev';
    const prefix = props?.context?.prefix || 'CCQM';

    // メール送信用のSNSトピックを作成
    this.emailTopic = new sns.Topic(this, 'EmailTopic', {
      topicName: `${prefix}-EmailTopic-${environment}`,
      displayName: `${prefix} Email Notification Topic (${environment})`,
    });

    // CloudFormation出力としてSNSトピックARNを出力
    new CfnOutput(this, 'EmailTopicArn', {
      value: this.emailTopic.topicArn,
      description: 'The ARN of the SNS topic for email notifications',
      exportName: `${prefix}-EmailTopicArn-${environment}`,
    });

    // キューイング用のSQSキューを作成（元のコードを保持）
    const queue = new sqs.Queue(this, 'QueueingQueue', {
      queueName: `${prefix}-QueueingQueue-${environment}`,
      visibilityTimeout: Duration.seconds(300)
    });

    // キューイング用のSNSトピックを作成（元のコードを保持）
    const queueingTopic = new sns.Topic(this, 'QueueingTopic', {
      topicName: `${prefix}-QueueingTopic-${environment}`,
      displayName: `${prefix} Queueing Notification Topic (${environment})`,
    });

    // キューイングトピックにSQSサブスクリプションを追加（元のコードを保持）
    queueingTopic.addSubscription(new subs.SqsSubscription(queue));

    // CloudFormation出力としてキューイングトピックARNを出力
    new CfnOutput(this, 'QueueingTopicArn', {
      value: queueingTopic.topicArn,
      description: 'The ARN of the SNS topic for queueing',
      exportName: `${prefix}-QueueingTopicArn-${environment}`,
    });

    // CloudFormation出力としてSQSキューURLを出力
    new CfnOutput(this, 'QueueUrl', {
      value: queue.queueUrl,
      description: 'The URL of the SQS queue for queueing',
      exportName: `${prefix}-QueueUrl-${environment}`,
    });
  }
}
