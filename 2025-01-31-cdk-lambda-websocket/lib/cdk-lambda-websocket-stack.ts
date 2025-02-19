import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import { LambdaConstruct } from "./lambda";

const projectName = "CLWS";
export class CdkLambdaWebsocketStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		new LambdaConstruct(this, `${projectName}`);
	}
}
