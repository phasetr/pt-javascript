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
		const prefix = "CRL";
		super(scope, id, props);

		// Remix Lambda関数の作成
		const remixLambda = new DockerImageFunction(
			this,
			`${prefix}RemixDockerImageFunction`,
			{
				code: DockerImageCode.fromImageAsset(
					path.join(__dirname, "..", "..", "remix"),
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

		// API GatewayのエンドポイントURLを出力
		new cdk.CfnOutput(this, `${prefix}RemixApiEndpoint`, {
			value: remixHttpApi.apiEndpoint,
			description: "Remix API Endpoint URL",
		});
	}
}
