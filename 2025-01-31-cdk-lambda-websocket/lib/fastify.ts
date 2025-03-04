import * as cdk from "aws-cdk-lib";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { WebSocketApi, WebSocketStage } from "aws-cdk-lib/aws-apigatewayv2";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Construct } from "constructs";

const projectName = "Fastify";

export interface WebSocketApiConstructProps extends cdk.StackProps {}

export class FastifyConstruct extends Construct {
	public readonly webSocketApiUrl: string;

	constructor(
		scope: Construct,
		id: string,
		_props?: WebSocketApiConstructProps,
	) {
		super(scope, id);

		// ChatServiceFunction の作成（aws_lambda_nodejs.NodejsFunction を利用）
		const chatServiceFunction = new nodejs.NodejsFunction(
			this,
			`${projectName}-ServiceFunction`,
			{
				runtime: lambda.Runtime.NODEJS_22_X,
				entry: "src/fastify/index.prod.ts",
			},
		);

		new logs.LogGroup(this, `${projectName}-ChatServiceFunctionLogGroup`, {
			logGroupName: `/aws/lambda/${projectName}`,
			removalPolicy: cdk.RemovalPolicy.DESTROY, // スタック削除時にロググループも削除
			retention: logs.RetentionDays.ONE_WEEK, // 任意の保持期間を設定（もしくは RetentionDays.INFINITE）
		});

		// WebSocket の $connect ルート用 Lambda 統合（L2 コンストラクト）
		new WebSocketLambdaIntegration(
			`${projectName}-ConnectIntegration`,
			chatServiceFunction,
		);

		// WebSocket API の作成（L2 コンストラクトを利用）
		const webSocketApi = new WebSocketApi(this, `${projectName}-WebSocketApi`, {
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
