import { CfnOutput, Duration, RemovalPolicy, Stack } from "aws-cdk-lib";
import type { StackProps } from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "node:path";
import type { Construct } from "constructs";

export class CdkTwoLambdaDynamodbStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		// プロジェクトの略称をプレフィックスとして使用
		const prefix = "CTLD";

		// DynamoDBテーブルの作成
		const table = new dynamodb.Table(this, `${prefix}-Table`, {
			tableName: `${prefix}-Table`,
			partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
			sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			removalPolicy: RemovalPolicy.DESTROY, // cdk destroyで削除できるように設定
		});

		// Hono API Lambda関数の作成
		const honoLambda = new lambda.Function(this, `${prefix}-HonoApi`, {
			functionName: `${prefix}-HonoApi`,
			runtime: lambda.Runtime.NODEJS_22_X,
			handler: "dist/index.handler",
			code: lambda.Code.fromAsset(path.join(__dirname, "../apps/hono-api")),
			environment: {
				TABLE_NAME: table.tableName,
			},
			logRetention: logs.RetentionDays.ONE_WEEK,
			timeout: Duration.seconds(30),
		});

		// DynamoDBテーブルへのアクセス権限を付与
		table.grantReadWriteData(honoLambda);

		// Hono API用のAPI Gatewayの作成
		const honoApi = new apigateway.LambdaRestApi(
			this,
			`${prefix}-HonoApiGateway`,
			{
				handler: honoLambda,
				proxy: true,
			},
		);

		// API GatewayのエンドポイントURLを出力
		new CfnOutput(this, `${prefix}HonoApiGatewayEndpoint`, {
			value: honoApi.url,
			description: "Hono API Gateway Endpoint",
		});
	}
}
