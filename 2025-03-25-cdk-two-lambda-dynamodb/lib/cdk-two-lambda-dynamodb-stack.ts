import { CfnOutput, RemovalPolicy, Stack } from "aws-cdk-lib";
import type { StackProps } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { HttpApi } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "node:path";
import type { Construct } from "constructs";
import {
	Architecture,
	DockerImageCode,
	DockerImageFunction,
} from "aws-cdk-lib/aws-lambda";

export class CdkTwoLambdaDynamodbStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		// 環境名を取得（デフォルトは 'dev'）
		const environment = this.node.tryGetContext('environment') || 'dev';
		
		// プロジェクトの略称をプレフィックスとして使用
		const prefix = "CTLD";
		
		// 環境名をリソース名に含める
		const resourcePrefix = `${prefix}-${environment}`;

		// DynamoDBテーブルの作成
		const table = new dynamodb.Table(this, `${resourcePrefix}-Table`, {
			tableName: `${resourcePrefix}-Table`,
			partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
			sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			removalPolicy: RemovalPolicy.DESTROY, // cdk destroyで削除できるように設定
		});

		// 環境ごとの設定
		const envConfig = {
			dev: {
				honoMemorySize: 512,
				honoTimeout: 30,
				remixMemorySize: 256
			},
			prod: {
				honoMemorySize: 1024,
				honoTimeout: 60,
				remixMemorySize: 512
			}
		};

		// 環境に応じた設定を取得
		const config = envConfig[environment as keyof typeof envConfig] || envConfig.dev;

		// Hono API Lambda関数の作成
		const honoDockerImageFunction = new DockerImageFunction(
			this,
			`${resourcePrefix}HonoDockerImageFunction`,
			{
				code: DockerImageCode.fromImageAsset(
					path.join(__dirname, "..", "apps", "hono-api"),
				),
				functionName: `${resourcePrefix}HonoDockerImageFunction`,
				architecture: Architecture.ARM_64,
				memorySize: config.honoMemorySize, // 環境に応じたメモリサイズ
				timeout: cdk.Duration.seconds(config.honoTimeout), // 環境に応じたタイムアウト
				environment: {
					ENVIRONMENT: environment // 環境名を環境変数として渡す
				}
			},
		);

		const honoHttpApi = new HttpApi(this, `${resourcePrefix}HonoHttpApi`);
		const honoHttpLambdaIntegration = new HttpLambdaIntegration(
			`${resourcePrefix}HonoHttpLambdaIntegration`,
			honoDockerImageFunction,
		);

		honoHttpApi.addRoutes({
			path: "/{proxy+}",
			integration: honoHttpLambdaIntegration,
		});

		/*
		// Hono API用のAPI Gatewayの作成
		const honoDockerImageFunctionRestApi = new apigateway.LambdaRestApi(
			this,
			`${prefix}HonoDockerImageFunctionRestApiGateway`,
			{
				handler: honoDockerImageFunction,
				proxy: true,
			},
		);
		*/

		// Remix Lambda関数の作成
		const remixLambda = new DockerImageFunction(
			this,
			`${resourcePrefix}RemixDockerImageFunction`,
			{
				code: DockerImageCode.fromImageAsset(
					path.join(__dirname, "..", "apps", "remix"),
				),
				functionName: `${resourcePrefix}RemixDockerImageFunction`,
				architecture: Architecture.ARM_64,
				memorySize: config.remixMemorySize, // 環境に応じたメモリサイズ
				environment: {
					ENVIRONMENT: environment, // 環境名を環境変数として渡す
					NODE_ENV: environment === 'prod' ? 'production' : 'development'
				}
			},
		);

		const remixHttpApi = new HttpApi(this, `${resourcePrefix}RemixHttpApi`);
		const remixHttpLambdaIntegration = new HttpLambdaIntegration(
			`${resourcePrefix}RemixHttpLambdaIntegration`,
			remixLambda,
		);

		remixHttpApi.addRoutes({
			path: "/{proxy+}",
			integration: remixHttpLambdaIntegration,
		});

		/*
		// Remix用のAPI Gatewayの作成
		const remixDockerImageFunctionLambdaRestApi = new apigateway.LambdaRestApi(
			this,
			`${resourcePrefix}-RemixApiGateway`,
			{
				handler: remixLambda,
				proxy: true,
			},
		);
		*/

		// DynamoDBテーブルへのアクセス権限を付与
		table.grantReadWriteData(honoDockerImageFunction);
		table.grantReadWriteData(remixLambda);

		// API GatewayのエンドポイントURLを出力
		new cdk.CfnOutput(this, `${resourcePrefix}HonoApiEndpoint`, {
			value: honoHttpApi.apiEndpoint,
			description: `Hono API Endpoint URL (${environment})`,
			exportName: `${resourcePrefix}HonoApiEndpoint`
		});

		new cdk.CfnOutput(this, `${resourcePrefix}RemixApiEndpoint`, {
			value: remixHttpApi.apiEndpoint,
			description: `Remix API Endpoint URL (${environment})`,
			exportName: `${resourcePrefix}RemixApiEndpoint`
		});

		// DynamoDBテーブル名を出力
		new cdk.CfnOutput(this, `${resourcePrefix}TableName`, {
			value: table.tableName,
			description: `DynamoDB Table Name (${environment})`,
			exportName: `${resourcePrefix}TableName`
		});

		/*
		new CfnOutput(this, `${resourcePrefix}HonoLambdaRestApiUrl`, {
			value: honoDockerImageFunctionRestApi.url,
			description: `Hono Lambda REST API URL (${environment})`,
		});
		new CfnOutput(this, `${resourcePrefix}RemixLambdaRestApiUrl`, {
			value: remixDockerImageFunctionLambdaRestApi.url,
			description: `Remix Lambda REST API URL (${environment})`,
		});
		*/
	}
}
