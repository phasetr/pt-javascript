#!/usr/bin/env node
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { SQSClient, GetQueueAttributesCommand } from "@aws-sdk/client-sqs";
import {
	CloudWatchLogsClient,
	FilterLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

// 環境変数から取得するか、コマンドライン引数から取得する
const environment = process.env.ENVIRONMENT || "dev";
const region = process.env.AWS_REGION || "ap-northeast-1";
const resourcePrefix = `CQLM-${environment}`;

// SNSトピック名とSQSキュー名
const topicName = `${resourcePrefix}-Topic`;
const queueName = `${resourcePrefix}-Queue`;
const functionName = `${resourcePrefix}-EmailFunction`;
const logGroupName = `/aws/lambda/${functionName}`;

// クライアントの初期化
const snsClient = new SNSClient({ region });
const sqsClient = new SQSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

// ARNの取得
const getTopicArn = async (): Promise<string> => {
	return `arn:aws:sns:${region}:${process.env.AWS_ACCOUNT_ID}:${topicName}`;
};

// キューのURLを取得
const getQueueUrl = async (): Promise<string> => {
	return `https://sqs.${region}.amazonaws.com/${process.env.AWS_ACCOUNT_ID}/${queueName}`;
};

// SNSトピックにメッセージを発行
const publishToTopic = async (message: string): Promise<string> => {
	const topicArn = await getTopicArn();
	console.log(`Publishing message to SNS topic: ${topicArn}`);

	const command = new PublishCommand({
		TopicArn: topicArn,
		Message: message,
		Subject: "Transcription message from CQLM verification script",
	});

	const response = await snsClient.send(command);
	console.log(`Message published with ID: ${response.MessageId}`);
	return response.MessageId || "";
};

// SQSキューの属性を取得
const getQueueAttributes = async (): Promise<Record<string, string>> => {
	const queueUrl = await getQueueUrl();
	console.log(`Getting attributes for SQS queue: ${queueUrl}`);

	const command = new GetQueueAttributesCommand({
		QueueUrl: queueUrl,
		AttributeNames: ["All"],
	});

	const response = await sqsClient.send(command);
	console.log("Queue attributes:", response.Attributes);
	return response.Attributes || {};
};

// CloudWatchログイベントの型定義
interface LogEvent {
	timestamp?: number;
	message?: string;
	logStreamName?: string;
	ingestionTime?: number;
	eventId?: string;
}

// CloudWatchログを取得
const getLogEvents = async (startTime: number): Promise<LogEvent[]> => {
	console.log(`Getting log events from CloudWatch log group: ${logGroupName}`);

	const command = new FilterLogEventsCommand({
		logGroupName,
		startTime,
		filterPattern: "Event received",
	});

	const response = await logsClient.send(command);
	return response.events || [];
};

// サンプルの会話データを生成
const generateSampleTranscription = (): string => {
	const now = new Date();
	const conversationId = `conv-${Math.floor(Math.random() * 10000)}`;
	
	// サンプルの会話内容
	const transcription = `
山田: こんにちは、本日はお時間をいただきありがとうございます。
田中: こちらこそ、お忙しいところありがとうございます。
山田: 先日お話しした新しいプロジェクトについて、もう少し詳しくご説明したいと思います。
田中: はい、ぜひお聞かせください。
山田: このプロジェクトは、AIを活用した顧客サポートシステムの開発を目指しています。
田中: 具体的にはどのような機能を想定されていますか？
山田: 主に3つの機能を考えています。まず、チャットボットによる24時間対応、次に音声認識による問い合わせ対応、最後に顧客データの分析と予測です。
田中: なるほど、かなり包括的なシステムですね。開発期間はどれくらいを見込んでいますか？
山田: 全体で約6ヶ月を予定しています。最初の2ヶ月でプロトタイプを作成し、その後4ヶ月で本番システムを構築する計画です。
田中: 分かりました。予算や必要なリソースについても教えていただけますか？
山田: もちろんです。予算は約2000万円を見込んでおり、開発チームは5名程度を想定しています。
田中: ありがとうございます。検討して、来週までに返答させていただきます。
山田: よろしくお願いいたします。何か質問があればいつでもご連絡ください。
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

// メイン関数
const main = async () => {
	try {
		// 現在の時刻を記録（ログフィルタリング用）
		const startTime = Date.now();

		// サンプルの会話データを生成
		const transcriptionMessage = generateSampleTranscription();
		console.log("Generated sample transcription message");

		// SNSトピックにメッセージを発行
		const messageId = await publishToTopic(transcriptionMessage);
		console.log(`Transcription message published with ID: ${messageId}`);

		// 少し待機してSQSキューとLambda関数が処理する時間を与える
		console.log("Waiting for message to be processed...");
		await new Promise((resolve) => setTimeout(resolve, 5000));

		// SQSキューの属性を取得
		const queueAttributes = await getQueueAttributes();
		console.log("Queue attributes after message publication:");
		console.log(
			`- ApproximateNumberOfMessages: ${queueAttributes.ApproximateNumberOfMessages}`,
		);
		console.log(
			`- ApproximateNumberOfMessagesNotVisible: ${queueAttributes.ApproximateNumberOfMessagesNotVisible}`,
		);

		// さらに待機してLambda関数が処理を完了する時間を与える
		console.log("Waiting for Lambda function to complete processing...");
		await new Promise((resolve) => setTimeout(resolve, 10000));

		// CloudWatchログを取得
		const logEvents = await getLogEvents(startTime);
		console.log(
			`Found ${logEvents.length} log events after message publication`,
		);

		if (logEvents.length > 0) {
			console.log("Latest log events:");
			for (const event of logEvents) {
				console.log(
					`[${new Date(event.timestamp || 0).toISOString()}] ${event.message}`,
				);
			}
		}

		console.log("\nVerification completed!");
		console.log(
			"Please check your email inbox to confirm that the transcription message was received.",
		);
		console.log("You can also check the CloudWatch logs for more details:");
		console.log(
			`https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups/log-group/${encodeURIComponent(logGroupName)}`,
		);
	} catch (error) {
		console.error("Error during verification:", error);
		process.exit(1);
	}
};

// スクリプトの実行
if (require.main === module) {
	// AWS_ACCOUNT_IDが設定されているか確認
	if (!process.env.AWS_ACCOUNT_ID) {
		console.error("Error: AWS_ACCOUNT_ID environment variable is not set.");
		console.error("Please set it before running this script:");
		console.error("export AWS_ACCOUNT_ID=<your-aws-account-id>");
		process.exit(1);
	}

	main().catch((error) => {
		console.error("Unhandled error:", error);
		process.exit(1);
	});
}
