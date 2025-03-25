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
		const honoDockerImageFunction = new DockerImageFunction(
			this,
			`${prefix}HonoDockerImageFunction`,
			{
				code: DockerImageCode.fromImageAsset(
					path.join(__dirname, "..", "apps", "hono-api"),
				),
				functionName: `${prefix}HonoDockerImageFunction`,
				architecture: Architecture.ARM_64,
				memorySize: 512, // メモリを増やす
				timeout: cdk.Duration.seconds(30), // タイムアウトを増やす
			},
		);

		const honoHttpApi = new HttpApi(this, `${prefix}HonoHttpApi`);
		const honoHttpLambdaIntegration = new HttpLambdaIntegration(
			`${prefix}HonoHttpLambdaIntegration`,
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
			`${prefix}RemixDockerImageFunction`,
			{
				code: DockerImageCode.fromImageAsset(
					path.join(__dirname, "..", "apps", "remix"),
				),
				functionName: `${prefix}RemixDockerImageFunction`,
				architecture: Architecture.ARM_64,
				memorySize: 256,
			},
		);

		const remixHttpApi = new HttpApi(this, `${prefix}RemixHttpApi`);
		const remixHttpLambdaIntegration = new HttpLambdaIntegration(
			`${prefix}RemixHttpLambdaIntegration`,
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
			`${prefix}-RemixApiGateway`,
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
		new cdk.CfnOutput(this, `${prefix}HonoApiEndpoint`, {
			value: honoHttpApi.apiEndpoint,
			description: "Hono API Endpoint URL",
		});

		new cdk.CfnOutput(this, `${prefix}RemixApiEndpoint`, {
			value: remixHttpApi.apiEndpoint,
			description: "Remix API Endpoint URL",
		});

		/*
		new CfnOutput(this, `${prefix}HonoLambdaRestApiUrl`, {
			value: honoDockerImageFunctionRestApi.url,
			description: "Hono Lambda REST API URL",
		});
		new CfnOutput(this, `${prefix}RemixLambdaRestApiUrl`, {
			value: remixDockerImageFunctionLambdaRestApi.url,
			description: "Remix Lambda REST API URL",
		});
		*/
	}
}
