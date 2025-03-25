import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import { HttpApi } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import {
	Architecture,
	DockerImageCode,
	DockerImageFunction,
} from "aws-cdk-lib/aws-lambda";
import type { Construct } from "constructs";

export class CdkStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		const prefix = "CHL";
		super(scope, id, props);

		// Hono API Lambda関数の作成
		const honoDockerImageFunction = new DockerImageFunction(
			this,
			`${prefix}HonoDockerImageFunction`,
			{
				code: DockerImageCode.fromImageAsset(
					path.join(__dirname, "..", "..", "hono-api"),
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

		// API GatewayのエンドポイントURLを出力
		new cdk.CfnOutput(this, `${prefix}HonoApiEndpoint`, {
			value: honoHttpApi.apiEndpoint,
			description: "Hono API Endpoint URL",
		});
	}
}
