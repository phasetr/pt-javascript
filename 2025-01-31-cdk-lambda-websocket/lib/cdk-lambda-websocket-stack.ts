import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import { ExpressConstruct } from "./express";

const projectName = "CLWS";
export class CdkLambdaWebsocketStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		new ExpressConstruct(this, `${projectName}-EC`);
	}
}
