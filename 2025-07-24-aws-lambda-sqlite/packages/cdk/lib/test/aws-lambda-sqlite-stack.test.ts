import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { describe, expect, it } from "vitest";
import { AwsLambdaSqliteStack } from "../aws-lambda-sqlite-stack";

describe("AwsLambdaSqliteStack", () => {
	it("should create a VPC with public and private subnets", () => {
		const app = new cdk.App();
		const stack = new AwsLambdaSqliteStack(app, "TestStack");
		const template = Template.fromStack(stack);

		// VPCが作成されることを確認
		template.hasResourceProperties("AWS::EC2::VPC", {
			CidrBlock: "10.0.0.0/16",
			EnableDnsHostnames: true,
			EnableDnsSupport: true,
		});

		// パブリックサブネットが作成されることを確認
		template.hasResourceProperties("AWS::EC2::Subnet", {
			MapPublicIpOnLaunch: true,
		});

		// プライベートサブネットが作成されることを確認
		template.hasResourceProperties("AWS::EC2::Subnet", {
			MapPublicIpOnLaunch: false,
		});
	});

	it("should create an EFS file system", () => {
		const app = new cdk.App();
		const stack = new AwsLambdaSqliteStack(app, "TestStack");
		const template = Template.fromStack(stack);

		// EFSファイルシステムが作成されることを確認
		template.hasResourceProperties("AWS::EFS::FileSystem", {
			Encrypted: true,
			LifecyclePolicies: [
				{
					TransitionToIA: "AFTER_30_DAYS",
				},
			],
			PerformanceMode: "generalPurpose",
			ThroughputMode: "bursting",
		});

		// EFSアクセスポイントが作成されることを確認
		template.hasResourceProperties("AWS::EFS::AccessPoint", {
			PosixUser: {
				Uid: "1000",
				Gid: "1000",
			},
			RootDirectory: {
				CreationInfo: {
					OwnerGid: "1000",
					OwnerUid: "1000",
					Permissions: "755",
				},
				Path: "/lambda",
			},
		});
	});

	it("should create a Lambda function with EFS mount", () => {
		const app = new cdk.App();
		const stack = new AwsLambdaSqliteStack(app, "TestStack");
		const template = Template.fromStack(stack);

		// Lambda関数が作成されることを確認
		template.hasResourceProperties("AWS::Lambda::Function", {
			Runtime: "nodejs20.x",
			MemorySize: 1024,
			Timeout: 300,
			Environment: {
				Variables: {
					NODE_OPTIONS: "--enable-source-maps",
					EFS_MOUNT_PATH: "/mnt/efs",
				},
			},
		});

		// Lambda関数がVPCに配置されることを確認
		const lambdaFunctions = template.findResources("AWS::Lambda::Function");
		const lambdaFunction = Object.values(lambdaFunctions)[0];
		expect(lambdaFunction).toBeDefined();
		expect(lambdaFunction?.Properties.VpcConfig).toBeDefined();
		expect(lambdaFunction?.Properties.VpcConfig.SubnetIds).toBeDefined();
		expect(lambdaFunction?.Properties.VpcConfig.SecurityGroupIds).toBeDefined();

		// EFSマウント設定があることを確認
		expect(lambdaFunction?.Properties.FileSystemConfigs).toBeDefined();
		expect(lambdaFunction?.Properties.FileSystemConfigs).toHaveLength(1);
		expect(lambdaFunction?.Properties.FileSystemConfigs[0].LocalMountPath).toBe(
			"/mnt/efs",
		);
	});

	it("should create a DynamoDB table", () => {
		const app = new cdk.App();
		const stack = new AwsLambdaSqliteStack(app, "TestStack");
		const template = Template.fromStack(stack);

		// DynamoDBテーブルが作成されることを確認
		template.hasResourceProperties("AWS::DynamoDB::Table", {
			TableName: "aws-lambda-sqlite-dev-main",
			BillingMode: "PAY_PER_REQUEST",
			KeySchema: [
				{
					AttributeName: "PK",
					KeyType: "HASH",
				},
				{
					AttributeName: "SK",
					KeyType: "RANGE",
				},
			],
		});

		// GSIが作成されることを確認
		const tables = template.findResources("AWS::DynamoDB::Table");
		const table = Object.values(tables)[0];
		expect(table).toBeDefined();
		expect(table?.Properties.GlobalSecondaryIndexes).toBeDefined();
		expect(table?.Properties.GlobalSecondaryIndexes).toHaveLength(1);
		expect(table?.Properties.GlobalSecondaryIndexes[0].IndexName).toBe("GSI1");
	});

	it("should create an API Gateway with Lambda integration", () => {
		const app = new cdk.App();
		const stack = new AwsLambdaSqliteStack(app, "TestStack");
		const template = Template.fromStack(stack);

		// API Gatewayが作成されることを確認
		template.hasResourceProperties("AWS::ApiGatewayV2::Api", {
			ProtocolType: "HTTP",
			CorsConfiguration: {
				AllowOrigins: ["*"],
				AllowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
				AllowHeaders: ["*"],
			},
		});

		// Lambda統合が作成されることを確認
		template.hasResourceProperties("AWS::ApiGatewayV2::Integration", {
			IntegrationType: "AWS_PROXY",
			PayloadFormatVersion: "2.0",
		});

		// ルートが作成されることを確認
		template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
			RouteKey: "ANY /{proxy+}",
		});
	});

	it("should output the API endpoint URL", () => {
		const app = new cdk.App();
		const stack = new AwsLambdaSqliteStack(app, "TestStack");
		const template = Template.fromStack(stack);

		// API URLが出力されることを確認
		template.hasOutput("ApiUrl", {
			Description: "API Gateway endpoint URL",
		});
	});

	it("should tag all resources with project name", () => {
		const app = new cdk.App();
		const stack = new AwsLambdaSqliteStack(app, "TestStack");

		// スタックレベルのタグが設定されていることを確認
		const template = Template.fromStack(stack);
		const vpc = template.findResources("AWS::EC2::VPC");
		const vpcResource = Object.values(vpc)[0];
		expect(vpcResource).toBeDefined();
		expect(vpcResource?.Properties.Tags).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					Key: "Project",
					Value: "aws-lambda-sqlite-efs",
				}),
				expect.objectContaining({
					Key: "Environment",
					Value: "dev",
				}),
			]),
		);
	});
});
