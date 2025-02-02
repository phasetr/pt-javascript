import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import type { Construct } from "constructs";
import * as path from "node:path";

export class CdkLambdaFastifyStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);
		const projectName = "LF";

		const apiLambda = new NodejsFunction(this, `${projectName}-LambdaFastify`, {
			functionName: `${projectName}-LambdaFastify`,
			entry: path.join(__dirname, "../src/index.ts"),
			handler: "handler",
			runtime: lambda.Runtime.NODEJS_22_X,
			environment: {
				NO_COLOR: "true",
			},
			bundling: {
				sourceMap: true,
				minify: true,
				target: "node22",
			},
		});

		const apiGateway = new apigateway.LambdaRestApi(
			this,
			`${projectName}-ApiGateway`,
			{
				handler: apiLambda,
			},
		);

		// API GatewayのURLを出力
		new CfnOutput(this, `${projectName}-ApiGatewayUrl`, {
			value: apiGateway.url,
		});
	}
}
