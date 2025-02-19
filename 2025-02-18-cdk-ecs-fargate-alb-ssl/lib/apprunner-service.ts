import * as apprunner from "@aws-cdk/aws-apprunner-alpha";
import type { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import type { Construct } from "constructs";

export interface AppRunnerServiceProps {
	projectName: string;
	dockerAsset: DockerImageAsset;
}

export function createAppRunnerService(
	scope: Construct,
	id: string,
	props: AppRunnerServiceProps,
): apprunner.Service {
	return new apprunner.Service(scope, id, {
		source: apprunner.Source.fromAsset({
			asset: props.dockerAsset,
			imageConfiguration: {
				port: 3000,
				environmentVariables: {
					SERVICE_URL_SECRET_NAME: `${props.projectName}_SERVICE_URL`,
					OPENAI_SECRET_NAME: `${props.projectName}_OPENAI_API_KEY`,
					WAF: "fastify",
				},
			},
		}),
		cpu: apprunner.Cpu.HALF_VCPU,
		memory: apprunner.Memory.ONE_GB,
		isPubliclyAccessible: true,
	});
}
