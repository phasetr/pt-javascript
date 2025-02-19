// Start of Selection
import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import * as apprunner from "@aws-cdk/aws-apprunner-alpha";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { DockerImageAsset, Platform } from "aws-cdk-lib/aws-ecr-assets";

const projectName = "cae";

export class CdkApprunnerEcrStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const dockerAsset = new DockerImageAsset(
			this,
			`${projectName}-DockerImage`,
			{
				directory: "src", // Dockerfile およびアプリケーションが存在するディレクトリ
        platform: Platform.LINUX_AMD64
			},
		);
		const app = new apprunner.Service(this, `${projectName}-app-runner`, {
			source: apprunner.Source.fromAsset({
				imageConfiguration: { port: 3000 },
				asset: dockerAsset,
			}),
			cpu: apprunner.Cpu.HALF_VCPU,
			memory: apprunner.Memory.ONE_GB,
			isPubliclyAccessible: true,
		});
		new cdk.CfnOutput(this, `${projectName}-app-runner-url`, {
			value: app.serviceUrl,
		});
	}
}
