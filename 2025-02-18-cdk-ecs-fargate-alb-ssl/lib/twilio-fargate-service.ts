import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import type * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { createDockerImageAsset } from "./docker-asset";

interface TwilioFargateServiceProps {
	vpc: ec2.Vpc;
	cluster?: ecs.Cluster; // 必要に応じて既存のECSクラスターを渡すことができます
	projectName: string;
}

export class TwilioFargateService extends Construct {
	public readonly loadBalancerDNS: cdk.CfnOutput;
	public readonly service: ecs.FargateService;

	constructor(scope: Construct, id: string, props: TwilioFargateServiceProps) {
		super(scope, id);

		const { vpc, projectName } = props;

		// ECS Clusterの作成（既存のものが渡されるならそれを利用可能）
		const cluster =
			props.cluster ??
			new ecs.Cluster(this, `${projectName}-EcsCluster`, { vpc });

		// Dockerイメージの作成
		const dockerAsset = createDockerImageAsset(
			this,
			`${projectName}-DockerImage`,
			"app",
		);

		// Fargateタスク定義の作成
		const taskDefinition = new ecs.FargateTaskDefinition(
			this,
			`${projectName}-TaskDef`,
			{
				cpu: 512,
				memoryLimitMiB: 1024,
			},
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

		// コンテナ定義の追加
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

		// Fargateサービスの作成
		this.service = new ecs.FargateService(
			this,
			`${projectName}-FargateService`,
			{
				cluster,
				taskDefinition,
				desiredCount: 1,
				assignPublicIp: true,
				minHealthyPercent: 50,
			},
		);

		// ALBの作成とFargateサービスへの紐付け
		const lb = new elbv2.ApplicationLoadBalancer(this, `${projectName}-LB`, {
			vpc,
			internetFacing: true,
		});
		const listener = lb.addListener(`${projectName}-Listener`, {
			port: 80,
			open: true,
		});
		listener.addTargets(`${projectName}-EcsTargetsHttp`, {
			port: 3000,
			protocol: elbv2.ApplicationProtocol.HTTP,
			targets: [this.service],
			healthCheck: { path: "/" },
		});

		// ALBのDNS名をOutputとして出力
		this.loadBalancerDNS = new cdk.CfnOutput(
			this,
			`${projectName}-LoadBalancerDNS`,
			{
				value: lb.loadBalancerDnsName,
			},
		);
	}
}
