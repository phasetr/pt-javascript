import { Duration, Stack, type StackProps, RemovalPolicy } from "aws-cdk-lib";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as path from "node:path";
import type { Construct } from "constructs";

// スタックの設定インターフェース
interface CqlmStackProps extends StackProps {
	environment?: string;
}

export class CqlmStack extends Stack {
	constructor(scope: Construct, id: string, props?: CqlmStackProps) {
		super(scope, id, props);

		// 環境の設定（デフォルトはdev）
		const environment = props?.environment || "dev";

		// プロジェクトの略称をプレフィックスとして使用
		const resourcePrefix = `CQLM-${environment}`;

		// SQSキューの作成
		const queue = new sqs.Queue(this, "CqlmQueue", {
			queueName: `${resourcePrefix}-Queue`,
			visibilityTimeout: Duration.seconds(300),
			retentionPeriod: Duration.days(4),
			// 開発環境ではスタック削除時にキューも削除
			removalPolicy: RemovalPolicy.DESTROY,
		});

		// SNSトピックの作成
		const topic = new sns.Topic(this, "CqlmTopic", {
			topicName: `${resourcePrefix}-Topic`,
		});

		// 開発環境ではスタック削除時にトピックも削除
		topic.applyRemovalPolicy(RemovalPolicy.DESTROY);

		// トピックからキューへのサブスクリプション
		topic.addSubscription(new subs.SqsSubscription(queue));

		// Lambda関数用のIAMロールを作成
		const lambdaRole = new iam.Role(this, "CqlmLambdaRole", {
			roleName: `${resourcePrefix}-LambdaRole`,
			assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
			managedPolicies: [
				iam.ManagedPolicy.fromAwsManagedPolicyName(
					"service-role/AWSLambdaBasicExecutionRole",
				),
			],
		});

		// SESの権限を追加
		lambdaRole.addToPolicy(
			new iam.PolicyStatement({
				actions: ["ses:SendEmail", "ses:SendRawEmail"],
				resources: ["*"],
			}),
		);

		// Lambda関数の作成
		const emailLambda = new lambda.Function(this, "CqlmEmailLambda", {
			functionName: `${resourcePrefix}-EmailFunction`,
			runtime: lambda.Runtime.NODEJS_20_X,
			handler: "index.handler",
			code: lambda.Code.fromAsset(path.join(__dirname, "../../lambda/dist")),
			timeout: Duration.seconds(30),
			memorySize: 256,
			role: lambdaRole,
			environment: {
				SENDER_EMAIL: "phasetr+sender@gmail.com", // 実際の送信元メールアドレスに置き換える
				ENVIRONMENT: environment,
			},
			logRetention: logs.RetentionDays.ONE_WEEK,
		});

		// 開発環境ではスタック削除時に関数も削除
		emailLambda.applyRemovalPolicy(RemovalPolicy.DESTROY);

		// SQSキューをLambda関数のイベントソースとして設定
		emailLambda.addEventSource(
			new lambdaEventSources.SqsEventSource(queue, {
				batchSize: 10, // 一度に処理するメッセージの最大数
				maxBatchingWindow: Duration.seconds(30), // バッチ処理の最大待機時間
			}),
		);
	}
}
