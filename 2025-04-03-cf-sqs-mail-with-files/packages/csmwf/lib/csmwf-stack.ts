import * as cdk from 'aws-cdk-lib';
import { Duration, Stack } from 'aws-cdk-lib';
import type { StackProps } from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'node:path';
import type { Construct } from 'constructs';

export interface CsmwfStackProps extends StackProps {
  environment: string;
}

export class CsmwfStack extends Stack {
  constructor(scope: Construct, id: string, props: CsmwfStackProps) {
    super(scope, id, props);

    const resourcePrefix = 'CSMWF';
    const environment = props.environment;

    // SQSキューの作成
    const queue = new sqs.Queue(this, `${resourcePrefix}Queue`, {
      queueName: `${resourcePrefix}-${environment}-Queue`,
      visibilityTimeout: Duration.seconds(300),
      retentionPeriod: Duration.days(14),
    });

    // Lambda関数用のIAMロールを作成
    const lambdaRole = new iam.Role(this, `${resourcePrefix}LambdaRole`, {
      roleName: `${resourcePrefix}-${environment}-LambdaRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // SESへのアクセス権限を追加
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      })
    );

    // Lambda関数の作成
    const emailSenderLambda = new NodejsFunction(this, `${resourcePrefix}EmailSenderLambda`, {
      functionName: `${resourcePrefix}-${environment}-EmailSender`,
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'handler',
      entry: path.join(__dirname, '..', 'lambda', 'email-sender.ts'),
      timeout: Duration.seconds(120), // タイムアウトを120秒に増やす
      memorySize: 512, // メモリサイズを512MBに増やす
      role: lambdaRole,
      environment: {
        ENVIRONMENT: environment,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        // AWS SDK v2はNode.js 20.xランタイムにデフォルトで含まれないため、バンドルに含める
        externalModules: [],
      },
    });

    // CloudWatchログの設定
    const logGroup = new logs.LogGroup(this, `${resourcePrefix}LambdaLogGroup`, {
      logGroupName: `/aws/lambda/${emailSenderLambda.functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SQSをLambdaのイベントソースとして設定
    emailSenderLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(queue, {
        batchSize: 10,
        maxBatchingWindow: Duration.seconds(5),
      })
    );

    // 出力
    new cdk.CfnOutput(this, 'QueueUrl', {
      value: queue.queueUrl,
      description: 'URL of the SQS queue',
      exportName: `${resourcePrefix}-${environment}-QueueUrl`,
    });

    new cdk.CfnOutput(this, 'LambdaFunction', {
      value: emailSenderLambda.functionName,
      description: 'Name of the Lambda function',
      exportName: `${resourcePrefix}-${environment}-LambdaFunction`,
    });
  }
}
