import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { aws_dynamodb, aws_lambda_nodejs, RemovalPolicy } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import { BillingMode, type Table } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import type { Construct } from "constructs";
import { WebSocketApi, WebSocketStage } from "aws-cdk-lib/aws-apigatewayv2";

const projectName = "WSACAT";

export class WebsocketApiChatAppTutorialStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const table = new aws_dynamodb.Table(
			this,
			`${projectName}-ConnectionsTable`,
			{
				billingMode: BillingMode.PROVISIONED,
				readCapacity: 5,
				writeCapacity: 5,
				removalPolicy: RemovalPolicy.DESTROY,
				partitionKey: {
					name: "connectionId",
					type: aws_dynamodb.AttributeType.STRING,
				},
			},
		);

		const connectHandler = this.connectHandlerBuilder(table);
		const disconnectHandler = this.disconnectHandlerBuilder(table);
		const sendMessageHandler = this.sendMessageHandlerBuilder(table);
		const defaultHandler = this.defaultHandlerBuilder();

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

		// WebSocket APIのURLを取得する
		new cdk.CfnOutput(this, `${projectName}-MessageApiUrl`, {
			value: `${webSocketApi.apiEndpoint}/${webSocketStage.stageName}`,
		});
	}

	connectHandlerBuilder(table: Table) {
		const handler = new aws_lambda_nodejs.NodejsFunction(
			this,
			`${projectName}-MessageApiWebSocketConnectHandler`,
			{
				environment: {
					table: table.tableName,
				},
				runtime: Runtime.NODEJS_22_X,
				entry: "lambda/connect-handler.ts",
			},
		);

		table.grantWriteData(handler);

		return handler;
	}

	disconnectHandlerBuilder(table: Table) {
		const handler = new aws_lambda_nodejs.NodejsFunction(
			this,
			`${projectName}-MessageApiWebSocketDisconnectHandler`,
			{
				environment: {
					table: table.tableName,
				},
				runtime: Runtime.NODEJS_22_X,
				entry: "lambda/disconnect-handler.ts",
			},
		);

		table.grantWriteData(handler);

		return handler;
	}

	sendMessageHandlerBuilder(table: Table) {
		const handler = new aws_lambda_nodejs.NodejsFunction(
			this,
			`${projectName}-MessageApiWebSocketSendHandler`,
			{
				environment: {
					table: table.tableName,
				},
				runtime: Runtime.NODEJS_22_X,
				entry: "lambda/send-handler.ts",
			},
		);

		table.grantReadWriteData(handler);

		return handler;
	}

	defaultHandlerBuilder() {
		return new aws_lambda_nodejs.NodejsFunction(
			this,
			`${projectName}-MessageApiWebSocketDefaultHandler`,
			{
				entry: "lambda/default-handler.ts",
				runtime: Runtime.NODEJS_22_X,
			},
		);
	}
}
