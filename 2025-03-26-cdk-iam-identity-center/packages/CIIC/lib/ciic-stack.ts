import { RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import type { Construct } from 'constructs';
import * as path from 'node:path';

export interface CiicStackProps extends StackProps {
  environment: 'dev' | 'prod';
}

export class CiicStack extends Stack {
  constructor(scope: Construct, id: string, props: CiicStackProps) {
    super(scope, id, props);

    const prefix = 'CIIC';
    const env = props.environment;

    // DynamoDB Table
    const table = new dynamodb.Table(this, 'Table', {
      tableName: `${prefix}-${env}-DDB`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY, // 開発用なので削除可能に設定
    });

    // GSI for entity queries
    table.addGlobalSecondaryIndex({
      indexName: 'EntityIndex',
      partitionKey: { name: 'entity', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    });

    // Lambda Function
    const apiFunction = new lambda.Function(this, 'ApiFunction', {
      functionName: `${prefix}-${env}-api`,
      runtime: lambda.Runtime.NODEJS_20_X, // 最新のNode.jsランタイム
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../hono-api/dist')),
      environment: {
        TABLE_NAME: table.tableName,
        ENVIRONMENT: env,
      },
    });

    // Grant Lambda permissions to access DynamoDB
    table.grantReadWriteData(apiFunction);

    // API Gateway
    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: `${prefix}-${env}-api`,
      description: `${prefix} API for ${env} environment`,
      deployOptions: {
        stageName: env,
      },
    });

    // Lambda Integration
    const lambdaIntegration = new apigateway.LambdaIntegration(apiFunction);
    api.root.addMethod('ANY', lambdaIntegration);
    api.root.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
    });
  }
}
