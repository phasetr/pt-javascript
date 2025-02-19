import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import { WebSocketApi, WebSocketStage } from "aws-cdk-lib/aws-apigatewayv2";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import type { Construct } from "constructs";

const projectName = "CLWS";
export class CdkLambdaWebsocketStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// ChatServiceFunction の作成（aws_lambda_nodejs.NodejsFunction を利用）
		const chatServiceFunction = new nodejs.NodejsFunction(
			this,
			`${projectName}-ServiceFunction`,
			{
				runtime: lambda.Runtime.NODEJS_22_X,
				entry: "src/express/lambda.ts",
			},
		);

		// WebSocket の $connect ルート用 Lambda 統合（L2 コンストラクト）
		new WebSocketLambdaIntegration("ConnectIntegration", chatServiceFunction);

		// WebSocket API の作成（L2 コンストラクトを利用）
		const webSocketApi = new WebSocketApi(this, "WebSocketApi", {
			routeSelectionExpression: "$request.body.action",
			connectRouteOptions: {
				integration: new WebSocketLambdaIntegration(
					`${projectName}-ConnectIntegration`,
					chatServiceFunction,
				),
			},
			disconnectRouteOptions: {
				integration: new WebSocketLambdaIntegration(
					`${projectName}-DisconnectIntegration`,
					chatServiceFunction,
				),
			},
			defaultRouteOptions: {
				integration: new WebSocketLambdaIntegration(
					`${projectName}-DefaultIntegration`,
					chatServiceFunction,
				),
			},
		});

		webSocketApi.grantManageConnections(chatServiceFunction);

		const webSocketStage = new WebSocketStage(this, `${projectName}-Prod`, {
			webSocketApi,
			stageName: "prod",
			autoDeploy: true,
		});

		// スタック作成時にエンドポイント URL を出力
		new cdk.CfnOutput(this, `${projectName}-WebSocketApiEndpoint`, {
			value: `${webSocketApi.apiEndpoint}/${webSocketStage.stageName}`,
		});
	}
}
