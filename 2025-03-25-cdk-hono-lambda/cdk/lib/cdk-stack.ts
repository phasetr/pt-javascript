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
		const projName = "CHL";
		super(scope, id, props);

		const honoFunction = new DockerImageFunction(
			this,
			`${projName}HonoFunction`,
			{
				code: DockerImageCode.fromImageAsset(
					path.join(__dirname, "..", "..", "hono-api"),
				),
				functionName: `${projName}HonoFunction`,
				architecture: Architecture.ARM_64,
				memorySize: 256,
			},
		);

		const httpApi = new HttpApi(this, `${projName}HttpApi`);
		const integration = new HttpLambdaIntegration(
			`${projName}LambdaIntegration`,
			honoFunction,
		);

		httpApi.addRoutes({
			path: "/{proxy+}",
			integration,
		});

		new cdk.CfnOutput(this, `${projName}ApiEndpoint`, {
			value: httpApi.apiEndpoint,
		});
	}
}
