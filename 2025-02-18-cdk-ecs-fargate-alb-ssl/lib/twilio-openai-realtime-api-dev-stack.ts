import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { createDockerImageAsset } from "./docker-asset";

const projectName = "CEFAS";

export class TwilioOpenaiRealtimeApiDevStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// VPCの作成（既存VPCを使う場合はimportしてください）
		const vpc = new ec2.Vpc(this, `${projectName}-Vpc`, { maxAzs: 2 });
		const cluster = new ecs.Cluster(this, `${projectName}-EcsCluster`, { vpc });
		const taskDefinition = new ecs.FargateTaskDefinition(
			this,
			`${projectName}-TaskDef`,
			{
				cpu: 512,
				memoryLimitMiB: 1024,
			},
		);

		// Dockerイメージの作成
		const dockerAsset = createDockerImageAsset(
			this,
			`${projectName}-DockerImage`,
			"app",
		);
		// Secrets Managerのシークレットの参照
		const openaiApiKey = secretsmanager.Secret.fromSecretNameV2(
			this,
			"OpenAiApiKey",
			"CEFAS_OPENAI_API_KEY",
		);
		const serviceURL = secretsmanager.Secret.fromSecretNameV2(
			this,
			"ServiceURL",
			"CEFAS_SERVICE_URL",
		);
		const container = taskDefinition.addContainer(
			`${projectName}-WebContainer`,
			{
				image: ecs.ContainerImage.fromDockerImageAsset(dockerAsset),
				logging: ecs.LogDrivers.awsLogs({ streamPrefix: "ecs" }),
				environment: {
					WAF: "fastify",
				},
				secrets: {
					OPENAI_API_KEY: ecs.Secret.fromSecretsManager(openaiApiKey),
					SERVICE_URL: ecs.Secret.fromSecretsManager(serviceURL),
				},
			},
		);
		container.addPortMappings({ containerPort: 3000 });

		// ApplicationLoadBalancedFargateServiceの作成
		const domainName = "academic-event.com";
		const fargateService =
			new ecsPatterns.ApplicationLoadBalancedFargateService(
				this,
				`${projectName}-service`,
				{
					cluster: cluster,
					desiredCount: 1,
					minHealthyPercent: 50,
					publicLoadBalancer: true,
					protocol: elbv2.ApplicationProtocol.HTTPS,
					domainName,
					// domainZone: route53.HostedZone.fromLookup(
					// 	this,
					// 	`${projectName}-hosted-zone`,
					// 	{ domainName: domainName },
					// ),
					domainZone: route53.HostedZone.fromHostedZoneAttributes(
						this,
						`${projectName}-HostedZone`,
						{
							hostedZoneId: "Z05380371NDWG1DPQ8BZC",
							zoneName: domainName,
						},
					),
					redirectHTTP: true,
					taskDefinition: taskDefinition,
				},
			);

		// ターゲットグループのヘルスチェックパスを設定
		fargateService.targetGroup.configureHealthCheck({ path: "/" });
	}
}
