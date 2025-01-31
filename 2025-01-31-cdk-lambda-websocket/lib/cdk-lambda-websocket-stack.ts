import { aws_lambda_nodejs } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import type { Construct } from "constructs";
import { WebSocketApi, WebSocketStage } from "aws-cdk-lib/aws-apigatewayv2";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";

const projectName = "CLWS";
export class CdkLambdaWebsocketStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const connectHandler = new aws_lambda_nodejs.NodejsFunction(
			this,
			`${projectName}-ConnectHandler`,
			{
				runtime: Runtime.NODEJS_22_X,
				entry: "src/ws/index.ts",
			},
		);
		const disconnectHandler = new aws_lambda_nodejs.NodejsFunction(
			this,
			`${projectName}-DisconnectHandler`,
			{
				runtime: Runtime.NODEJS_22_X,
				entry: "src/ws/index.ts",
			},
		);
		const sendMessageHandler = new aws_lambda_nodejs.NodejsFunction(
			this,
			`${projectName}-SendHandler`,
			{
				runtime: Runtime.NODEJS_22_X,
				entry: "src/ws/index.ts",
			},
		);
		const defaultHandler = new aws_lambda_nodejs.NodejsFunction(
			this,
			`${projectName}-DefaultHandler`,
			{
				runtime: Runtime.NODEJS_22_X,
				entry: "src/ws/index.ts",
			},
		);

		const webSocketApi = new WebSocketApi(this, `${projectName}-Api`, {
			routeSelectionExpression: "$request.body.action",
			connectRouteOptions: {
				integration: new WebSocketLambdaIntegration(
					`${projectName}-ConnectIntegration`,
					connectHandler,
				),
			},
			disconnectRouteOptions: {
				integration: new WebSocketLambdaIntegration(
					`${projectName}-DisconnectIntegration`,
					disconnectHandler,
				),
			},
			defaultRouteOptions: {
				integration: new WebSocketLambdaIntegration(
					`${projectName}-DefaultIntegration`,
					defaultHandler,
				),
			},
		});

		webSocketApi.addRoute("send-message", {
			integration: new WebSocketLambdaIntegration(
				`${projectName}-SendIntegration`,
				sendMessageHandler,
			),
		});

		webSocketApi.grantManageConnections(sendMessageHandler);
		webSocketApi.grantManageConnections(defaultHandler);

		const webSocketStage = new WebSocketStage(this, `${projectName}-Prod`, {
			webSocketApi,
			stageName: "prod",
			autoDeploy: true,
		});

		// WebSocketのURLを出力
		new cdk.CfnOutput(this, `${projectName}-WebSocketUrl`, {
			value: `${webSocketApi.apiEndpoint}/${webSocketStage.stageName}`,
		});
	}
}
