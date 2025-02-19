import * as cdk from "aws-cdk-lib";
import { aws_lambda_nodejs } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { WebSocketApi, WebSocketStage } from "aws-cdk-lib/aws-apigatewayv2";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Construct } from "constructs";

const projectName = "PL";

export interface WebSocketApiConstructProps extends cdk.StackProps {}

export class LambdaConstruct extends Construct {
	public readonly webSocketApiUrl: string;

	constructor(
		scope: Construct,
		id: string,
		props?: WebSocketApiConstructProps,
	) {
		super(scope, id);

		const connectHandler = new aws_lambda_nodejs.NodejsFunction(
			this,
			`${projectName}-MessageApiWebSocketConnectHandler`,
			{
				runtime: Runtime.NODEJS_22_X,
				entry: "src/lambda/connect-handler.ts",
			},
		);

		const disconnectHandler = new aws_lambda_nodejs.NodejsFunction(
			this,
			`${projectName}-MessageApiWebSocketDisconnectHandler`,
			{
				runtime: Runtime.NODEJS_22_X,
				entry: "src/lambda/disconnect-handler.ts",
			},
		);

		const sendMessageHandler = new aws_lambda_nodejs.NodejsFunction(
			this,
			`${projectName}-MessageApiWebSocketSendHandler`,
			{
				runtime: Runtime.NODEJS_22_X,
				entry: "src/lambda/send-handler.ts",
			},
		);

		const defaultHandler = new aws_lambda_nodejs.NodejsFunction(
			this,
			`${projectName}-MessageApiWebSocketDefaultHandler`,
			{
				entry: "src/lambda/default-handler.ts",
				runtime: Runtime.NODEJS_22_X,
			},
		);

		const webSocketApi = new WebSocketApi(this, `${projectName}-MessageApi`, {
			routeSelectionExpression: "$request.body.action",
			connectRouteOptions: {
				integration: new WebSocketLambdaIntegration(
					`${projectName}-MessageApiConnectIntegration`,
					connectHandler,
				),
			},
			disconnectRouteOptions: {
				integration: new WebSocketLambdaIntegration(
					`${projectName}-MessageApiDisconnectIntegration`,
					disconnectHandler,
				),
			},
			defaultRouteOptions: {
				integration: new WebSocketLambdaIntegration(
					`${projectName}-MessageApiDefaultIntegration`,
					defaultHandler,
				),
			},
		});

		webSocketApi.addRoute("send-message", {
			integration: new WebSocketLambdaIntegration(
				`${projectName}-MessageApiSendIntegration`,
				sendMessageHandler,
			),
		});

		webSocketApi.grantManageConnections(sendMessageHandler);
		webSocketApi.grantManageConnections(defaultHandler);

		const webSocketStage = new WebSocketStage(
			this,
			`${projectName}-MessageApiProd`,
			{
				webSocketApi,
				stageName: "prod",
				autoDeploy: true,
			},
		);

		this.webSocketApiUrl = `${webSocketApi.apiEndpoint}/${webSocketStage.stageName}`;
		new cdk.CfnOutput(this, `${projectName}-MessageApiUrl`, {
			value: this.webSocketApiUrl,
		});
	}
}
