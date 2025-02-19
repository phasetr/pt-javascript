import * as apprunner from "@aws-cdk/aws-apprunner-alpha";
import type { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import type { Construct } from "constructs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export interface AppRunnerServiceWithSecretsProps {
	projectName: string;
	dockerAsset: DockerImageAsset;
	openaiSecretName: string;
	serviceURLSecretName: string;
}

export function createAppRunnerServiceWithSecrets(
	scope: Construct,
	id: string,
	props: AppRunnerServiceWithSecretsProps,
) {
	// App Runner サービスを作成
	const service = new apprunner.Service(scope, id, {
		source: apprunner.Source.fromAsset({
			asset: props.dockerAsset,
			imageConfiguration: {
				port: 3000,
				environmentVariables: {
					OPENAI_SECRET_NAME: props.openaiSecretName,
					SERVICE_URL_SECRET_NAME: props.serviceURLSecretName,
					WAF: "fastify",
				},
			},
		}),
		cpu: apprunner.Cpu.HALF_VCPU,
		memory: apprunner.Memory.ONE_GB,
		isPubliclyAccessible: true,
	});

	// Secrets Manager で指定したシークレットの読み取り権限を付与
	const openaiSecret = secretsmanager.Secret.fromSecretNameV2(
		scope,
		`${props.projectName}-OpenAiApiSecret`,
		props.openaiSecretName,
	);
	openaiSecret.grantRead(service);

	const serviceURLSecret = secretsmanager.Secret.fromSecretNameV2(
		scope,
		`${props.projectName}-serviceURLSecret`,
		props.serviceURLSecretName,
	);
	serviceURLSecret.grantRead(service);

	return service;
}
