import * as cdk from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
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
				remixTimeout: 30
			},
			prod: {
				honoMemorySize: 512,
				honoTimeout: 60,
				remixMemorySize: 256,
				remixTimeout: 60
			}
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
			removalPolicy: cdk.RemovalPolicy.DESTROY
		});

		// ユーザーIDによるグローバルセカンダリインデックスの追加
		todosTable.addGlobalSecondaryIndex({
			indexName: `${resourcePrefix}UserIdIndex`,
			partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
			projectionType: dynamodb.ProjectionType.ALL
		});

		// Secrets Managerの作成 - アプリケーション設定
		const appConfigSecret = new secretsmanager.Secret(this, `${resourcePrefix}AppConfigSecret`, {
			secretName: `${resourcePrefix}/AppConfig`,
			description: 'アプリケーション設定',
			generateSecretString: {
				secretStringTemplate: JSON.stringify({
					environment: environment, // 環境名
					region: this.region,
					stage: environment === 'prod' ? 'production' : 'development'
				}),
				generateStringKey: 'key'
			},
			removalPolicy: cdk.RemovalPolicy.DESTROY // cdk destroyでシークレットも削除する
		});

		// Secrets Managerの作成 - Basic認証情報
		const basicAuthSecret = new secretsmanager.Secret(this, `${resourcePrefix}BasicAuthSecret`, {
			secretName: `${resourcePrefix}/BasicAuth`,
			description: 'Basic認証の認証情報',
			generateSecretString: {
				secretStringTemplate: JSON.stringify({
					username: 'admin',
					password: 'password'
				}),
				generateStringKey: 'key'
			},
			removalPolicy: cdk.RemovalPolicy.DESTROY // cdk destroyでシークレットも削除する
		});

		const honoLambda = new lambda.DockerImageFunction(
			this,
			`${resourcePrefix}HonoDockerImageFunction`,
			{
				code: lambda.DockerImageCode.fromImageAsset(
					path.join(__dirname, "..", "..", "hono-api")
				),
				functionName: `${resourcePrefix}HonoDockerImageFunction`,
				architecture: lambda.Architecture.ARM_64,
				memorySize: config.honoMemorySize, // 環境に応じたメモリサイズ
				timeout: cdk.Duration.seconds(config.honoTimeout), // 環境に応じたタイムアウト
				environment: {
					// 環境変数はSecrets Managerのシークレット名のみ
					APP_CONFIG_SECRET_NAME: appConfigSecret.secretName,
					BASIC_AUTH_SECRET_NAME: basicAuthSecret.secretName
				}
			}
		);

		// Lambda関数にSecrets Managerへのアクセス権限を付与
		appConfigSecret.grantRead(honoLambda);
		basicAuthSecret.grantRead(honoLambda);

		// Lambda関数にDynamoDBへのアクセス権限を付与
		todosTable.grantReadWriteData(honoLambda);

		const apiGw = new apigw.LambdaRestApi(this, `${resourcePrefix}honoApi`, {
			handler: honoLambda
		});

		// API GatewayのエンドポイントURLを出力
		new cdk.CfnOutput(this, `${resourcePrefix}ApiEndpoint`, {
			value: apiGw.url,
			description: "API Gateway endpoint URL"
		});
	}
}
