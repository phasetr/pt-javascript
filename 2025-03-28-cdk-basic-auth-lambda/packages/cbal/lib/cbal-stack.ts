import * as cdk from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Duration, Stack, type StackProps } from "aws-cdk-lib";
import * as dotenv from "dotenv";
import path = require("node:path");

dotenv.config();

export class CbalStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		// 環境名を取得（デフォルトは 'dev'）
		const environment = this.node.tryGetContext("environment") || "dev";

		// プロジェクトの略称をプレフィックスとして使用
		const prefix = "CBAL";
		// 環境名をリソース名に含める
		const resourcePrefix = `${prefix}-${environment}`;

		// 環境ごとの設定
		const envConfig = {
			dev: {
				honoMemorySize: 512,
				honoTimeout: 30,
				remixMemorySize: 256,
				remixTimeout: 30,
			},
			prod: {
				honoMemorySize: 512,
				honoTimeout: 60,
				remixMemorySize: 256,
				remixTimeout: 60,
			},
		};
		// 環境に応じた設定を取得
		const config =
			envConfig[environment as keyof typeof envConfig] || envConfig.dev;

		// DynamoDBテーブルの作成
		const todosTable = new dynamodb.Table(this, `${resourcePrefix}TodosTable`, {
			tableName: `${resourcePrefix}Todos`,
			partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
			billingMode: dynamodb.BillingMode.PROVISIONED,
			// Sampleのため1
			readCapacity: 1,
			writeCapacity: 1,
			// cdk destroyでテーブルも削除する
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		// ユーザーIDによるグローバルセカンダリインデックスの追加
		todosTable.addGlobalSecondaryIndex({
			indexName: `${resourcePrefix}UserIdIndex`,
			partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
			projectionType: dynamodb.ProjectionType.ALL,
		});

		const honoLambda = new lambda.DockerImageFunction(
			this,
			`${resourcePrefix}HonoDockerImageFunction`,
			{
				code: lambda.DockerImageCode.fromImageAsset(
					path.join(__dirname, "..", "..", "hono-api"),
				),
				functionName: `${resourcePrefix}HonoDockerImageFunction`,
				architecture: lambda.Architecture.ARM_64,
				memorySize: config.honoMemorySize, // 環境に応じたメモリサイズ
				timeout: cdk.Duration.seconds(config.honoTimeout), // 環境に応じたタイムアウト
				environment: {
					ENV: environment, // 環境名を環境変数として渡す
					BASIC_USERNAME: process.env.BASIC_USERNAME || "admin", // Basic認証のユーザー名：実際のプロダクトではSecret Managerなどで管理
					BASIC_PASSWORD: process.env.BASIC_PASSWORD || "password", // Basic認証のパスワード：実際のプロダクトではSecret Managerなどで管理
				},
			},
		);

		// Lambda関数にDynamoDBへのアクセス権限を付与
		todosTable.grantReadWriteData(honoLambda);

		const apiGw = new apigw.LambdaRestApi(this, `${resourcePrefix}honoApi`, {
			handler: honoLambda,
		});

		// API GatewayのエンドポイントURLを出力
		new cdk.CfnOutput(this, `${resourcePrefix}ApiEndpoint`, {
			value: apiGw.url,
			description: "API Gateway endpoint URL",
		});
	}
}
