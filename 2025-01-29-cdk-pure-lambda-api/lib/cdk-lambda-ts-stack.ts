import { CfnOutput, Duration, Stack, type StackProps } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import type { Construct } from "constructs";

export class CdkLambdaTsStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);
		const projectName = "LT";

		const api = new lambda.Function(this, `${projectName}-HelloWorld`, {
			functionName: `${projectName}-HelloWorld`,
			handler: "handler.handler",
			runtime: lambda.Runtime.NODEJS_22_X,
			code: new lambda.AssetCode("./src"),
			memorySize: 512,
			timeout: Duration.seconds(10),
		});

		// Define the Lambda function resource
		const apiUrl = api.addFunctionUrl({
			authType: lambda.FunctionUrlAuthType.NONE,
		});

		// Define a CloudFormation Output for your URL
		new CfnOutput(this, `${projectName}-LambdaApiUrlOutput`, {
			value: apiUrl.url,
			description: "lambda function URL",
			exportName: `${projectName}-LambdaApiUrl`,
		});
	}
}
