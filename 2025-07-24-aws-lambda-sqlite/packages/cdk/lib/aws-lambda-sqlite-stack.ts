import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigatewayv2Integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as efs from "aws-cdk-lib/aws-efs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import type { Construct } from "constructs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AwsLambdaSqliteStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// VPCの作成
		const vpc = new ec2.Vpc(this, "LambdaSqliteVpc", {
			vpcName: "aws-lambda-sqlite-vpc",
			ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
			maxAzs: 2,
			natGateways: 1,
			subnetConfiguration: [
				{
					cidrMask: 24,
					name: "Public",
					subnetType: ec2.SubnetType.PUBLIC,
				},
				{
					cidrMask: 24,
					name: "Private",
					subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
				},
			],
			enableDnsHostnames: true,
			enableDnsSupport: true,
		}) as ec2.IVpc;

		// EFSファイルシステムの作成
		const fileSystem = new efs.FileSystem(this, "LambdaSqliteEfs", {
			vpc,
			fileSystemName: "aws-lambda-sqlite-efs",
			performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
			throughputMode: efs.ThroughputMode.BURSTING,
			encrypted: true,
			lifecyclePolicy: efs.LifecyclePolicy.AFTER_30_DAYS,
			removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発環境用
		});

		// EFSアクセスポイントの作成
		const accessPoint = new efs.AccessPoint(this, "LambdaSqliteAccessPoint", {
			fileSystem,
			path: "/lambda",
			posixUser: {
				uid: "1000",
				gid: "1000",
			},
			createAcl: {
				ownerUid: "1000",
				ownerGid: "1000",
				permissions: "755",
			},
		});

		// DynamoDBテーブルの作成
		const table = new dynamodb.Table(this, "MainTable", {
			tableName: "aws-lambda-sqlite-dev-main",
			partitionKey: {
				name: "PK",
				type: dynamodb.AttributeType.STRING,
			},
			sortKey: {
				name: "SK",
				type: dynamodb.AttributeType.STRING,
			},
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発環境用
		});

		// GSIの追加
		table.addGlobalSecondaryIndex({
			indexName: "GSI1",
			partitionKey: {
				name: "GSI1PK",
				type: dynamodb.AttributeType.STRING,
			},
			sortKey: {
				name: "GSI1SK",
				type: dynamodb.AttributeType.STRING,
			},
		});

		// Lambda関数用のセキュリティグループ
		const lambdaSecurityGroup = new ec2.SecurityGroup(
			this,
			"LambdaSecurityGroup",
			{
				vpc,
				description: "Security group for Lambda function",
				allowAllOutbound: true,
			},
		);

		// EFS用のセキュリティグループ
		const efsSecurityGroup = new ec2.SecurityGroup(this, "EfsSecurityGroup", {
			vpc,
			description: "Security group for EFS",
		});

		// LambdaからEFSへのアクセスを許可
		efsSecurityGroup.addIngressRule(
			lambdaSecurityGroup,
			ec2.Port.tcp(2049),
			"Allow NFS access from Lambda",
		);

		// Lambda関数の作成
		const lambdaFunction = new lambda.Function(this, "ApiFunction", {
			functionName: "aws-lambda-sqlite-api",
			runtime: lambda.Runtime.NODEJS_20_X,
			handler: "index.handler",
			code: lambda.Code.fromAsset(
				path.join(__dirname, "..", "..", "api", "lambda.zip"),
			),
			memorySize: 1024,
			timeout: cdk.Duration.seconds(300),
			vpc,
			vpcSubnets: {
				subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
			},
			securityGroups: [lambdaSecurityGroup],
			filesystem: lambda.FileSystem.fromEfsAccessPoint(accessPoint, "/mnt/efs"),
			environment: {
				NODE_OPTIONS: "--enable-source-maps",
				EFS_MOUNT_PATH: "/mnt/efs",
				DYNAMODB_TABLE_NAME: table.tableName,
				AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
			},
		});

		// Lambda関数にDynamoDBアクセス権限を付与
		table.grantReadWriteData(lambdaFunction);

		// Lambda関数にEFSアクセス権限を付与
		lambdaFunction.addToRolePolicy(
			new iam.PolicyStatement({
				effect: iam.Effect.ALLOW,
				actions: [
					"elasticfilesystem:ClientMount",
					"elasticfilesystem:ClientWrite",
					"elasticfilesystem:DescribeMountTargets",
				],
				resources: [fileSystem.fileSystemArn],
			}),
		);

		// API Gatewayの作成
		const httpApi = new apigatewayv2.HttpApi(this, "HttpApi", {
			apiName: "aws-lambda-sqlite-api",
			description: "API for AWS Lambda SQLite with EFS experiment",
			corsPreflight: {
				allowOrigins: ["*"],
				allowMethods: [
					apigatewayv2.CorsHttpMethod.GET,
					apigatewayv2.CorsHttpMethod.POST,
					apigatewayv2.CorsHttpMethod.PUT,
					apigatewayv2.CorsHttpMethod.DELETE,
					apigatewayv2.CorsHttpMethod.OPTIONS,
				],
				allowHeaders: ["*"],
			},
		});

		// Lambda統合の作成
		const lambdaIntegration =
			new apigatewayv2Integrations.HttpLambdaIntegration(
				"LambdaIntegration",
				lambdaFunction,
			);

		// デフォルトルートの設定
		httpApi.addRoutes({
			path: "/{proxy+}",
			methods: [apigatewayv2.HttpMethod.ANY],
			integration: lambdaIntegration,
		});

		// タグの追加
		cdk.Tags.of(this).add("Project", "aws-lambda-sqlite-efs");
		cdk.Tags.of(this).add("Environment", "dev");

		// 出力
		new cdk.CfnOutput(this, "ApiUrl", {
			value: httpApi.url ?? "API URL not available",
			description: "API Gateway endpoint URL",
		});

		new cdk.CfnOutput(this, "EfsFileSystemId", {
			value: fileSystem.fileSystemId,
			description: "EFS File System ID",
		});

		new cdk.CfnOutput(this, "DynamoDbTableName", {
			value: table.tableName,
			description: "DynamoDB table name",
		});
	}
}
