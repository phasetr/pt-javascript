import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import { ProperLambdaConstruct } from "./proper-lambda";

const projectName = "CLWS";
export class CdkLambdaWebsocketStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		new ProperLambdaConstruct(this, `${projectName}`);
	}
}
