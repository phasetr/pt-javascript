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
		const projName = "CRL";
		super(scope, id, props);

		const remixFunction = new DockerImageFunction(
			this,
			`${projName}RemixFunction`,
			{
				code: DockerImageCode.fromImageAsset(
					path.join(__dirname, "..", "..", "remix"),
				),
				functionName: `${projName}RemixFunction`,
				architecture: Architecture.ARM_64,
				memorySize: 256,
			},
		);

		const httpApi = new HttpApi(this, `${projName}HttpApi`);
		const integration = new HttpLambdaIntegration(
			`${projName}LambdaIntegration`,
			remixFunction,
		);

		httpApi.addRoutes({
			path: "/{proxy+}",
			integration,
		});

		new cdk.CfnOutput(this, `${projName}-ApiEndpoint`, {
			value: httpApi.apiEndpoint,
		});
	}
}
