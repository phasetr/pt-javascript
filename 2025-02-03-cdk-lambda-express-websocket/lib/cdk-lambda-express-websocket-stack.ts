import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import { WebSocketApi, WebSocketStage } from "aws-cdk-lib/aws-apigatewayv2";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as iam from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";

export class CdkLambdaExpressWebsocketStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// ChatServiceFunction の作成（aws_lambda_nodejs.NodejsFunction を利用）
		const chatServiceFunction = new nodejs.NodejsFunction(
			this,
			"ChatServiceFunction",
			{
				functionName: "ChatService",
				entry: "src/express/lambda.ts",
				handler: "handler",
				runtime: lambda.Runtime.NODEJS_22_X,
				memorySize: 256,
				timeout: cdk.Duration.seconds(30),
				environment: {
					NODE_ENV: "dev",
				},
			},
		);

		// 必要なマネージドポリシーを付与
		chatServiceFunction.role?.addManagedPolicy(
			iam.ManagedPolicy.fromAwsManagedPolicyName(
				"service-role/AWSLambdaBasicExecutionRole",
			),
		);
		chatServiceFunction.role?.addManagedPolicy(
			iam.ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_ReadOnlyAccess"),
		);
		chatServiceFunction.role?.addManagedPolicy(
			iam.ManagedPolicy.fromAwsManagedPolicyName("AWSXrayWriteOnlyAccess"),
		);

		chatServiceFunction.addToRolePolicy(
			new iam.PolicyStatement({
				effect: iam.Effect.ALLOW,
				actions: ["execute-api:ManageConnections", "execute-api:Invoke"],
				resources: [
					`arn:aws:execute-api:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*/dev/POST/@connections/*`,
				],
			}),
		);

		// API Gateway から Lambda 呼び出しの権限を付与
		chatServiceFunction.grantInvoke(
			new iam.ServicePrincipal("apigateway.amazonaws.com"),
		);

		// WebSocket の $connect ルート用 Lambda 統合（L2 コンストラクト）
		const connectIntegration = new WebSocketLambdaIntegration(
			"ConnectIntegration",
			chatServiceFunction,
		);

		// WebSocket API の作成（L2 コンストラクトを利用）
		const webSocketApi = new WebSocketApi(this, "WebSocketApi", {
			apiName: "WebSocketApi",
			routeSelectionExpression: "$request.body.action",
			connectRouteOptions: {
				integration: connectIntegration,
			},
		});

		// Stage の作成（dev ステージ）
		const stage = new WebSocketStage(this, "WebSocketStage", {
			webSocketApi,
			stageName: "dev",
			autoDeploy: true,
		});

		// スタック作成時にエンドポイント URL を出力
		new cdk.CfnOutput(this, "WebSocketApiEndpoint", {
			value: stage.url,
		});
	}
}
