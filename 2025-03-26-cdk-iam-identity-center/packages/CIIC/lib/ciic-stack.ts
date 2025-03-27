import { RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sso from 'aws-cdk-lib/aws-sso';
import * as identitystore from 'aws-cdk-lib/aws-identitystore';
import * as iam from 'aws-cdk-lib/aws-iam';
import type { Construct } from 'constructs';
import * as path from 'node:path';

export interface CiicStackProps extends StackProps {
  environment: 'dev' | 'prod';
  /**
   * Optional Identity Store ID for IAM Identity Center
   * If not provided, the stack will assume IAM Identity Center is already set up
   */
  identityStoreId?: string;
  /**
   * Optional IAM Identity Center instance ARN
   * If not provided, the stack will assume IAM Identity Center is already set up
   */
  ssoInstanceArn?: string;
}

export class CiicStack extends Stack {
  constructor(scope: Construct, id: string, props: CiicStackProps) {
    super(scope, id, props);

    const prefix = 'CIIC';
    const env = props.environment;
    const { identityStoreId, ssoInstanceArn } = props;

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

    // IAM Identity Center Configuration
    if (ssoInstanceArn && identityStoreId) {
      this.configureIamIdentityCenter(prefix, env, ssoInstanceArn, identityStoreId, apiFunction, table);
    }
  }

  /**
   * Configure IAM Identity Center (AWS SSO) for the project
   */
  private configureIamIdentityCenter(
    prefix: string,
    env: string,
    ssoInstanceArn: string,
    identityStoreId: string,
    lambdaFunction: lambda.Function,
    dynamoTable: dynamodb.Table
  ): void {
    // Create permission sets for different access levels
    
    // 1. Read-only permission set
    const readOnlyPermissionSet = new sso.CfnPermissionSet(this, 'ReadOnlyPermissionSet', {
      name: `${prefix}-${env}-ReadOnly`,
      description: `Read-only access for ${prefix} ${env} environment`,
      instanceArn: ssoInstanceArn,
      sessionDuration: 'PT12H', // 12 hour session
      managedPolicies: ['arn:aws:iam::aws:policy/ReadOnlyAccess'],
    });

    // 2. Developer permission set (can invoke Lambda and read/write to DynamoDB)
    // Create custom policy for developer permissions
    const developerPolicy = new iam.PolicyDocument({
      statements: [
        // Lambda invoke permissions
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'lambda:InvokeFunction',
            'lambda:GetFunction',
            'lambda:ListFunctions',
            'lambda:GetFunctionConfiguration',
          ],
          resources: [lambdaFunction.functionArn],
        }),
        // DynamoDB permissions
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:Query',
            'dynamodb:Scan',
            'dynamodb:BatchGetItem',
            'dynamodb:DescribeTable',
          ],
          resources: [
            dynamoTable.tableArn,
            `${dynamoTable.tableArn}/index/*`,
          ],
        }),
        // CloudWatch Logs permissions for Lambda logs
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'logs:DescribeLogGroups',
            'logs:DescribeLogStreams',
            'logs:GetLogEvents',
          ],
          resources: ['*'],
        }),
      ],
    });

    const developerPermissionSet = new sso.CfnPermissionSet(this, 'DeveloperPermissionSet', {
      name: `${prefix}-${env}-Developer`,
      description: `Developer access for ${prefix} ${env} environment`,
      instanceArn: ssoInstanceArn,
      sessionDuration: 'PT12H', // 12 hour session
      inlinePolicy: developerPolicy.toJSON(),
    });

    // 3. Admin permission set (full access to project resources)
    // Create custom policy for admin permissions
    const adminPolicy = new iam.PolicyDocument({
      statements: [
        // Lambda full permissions
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'lambda:*',
          ],
          resources: [
            lambdaFunction.functionArn,
            `${lambdaFunction.functionArn}:*`,
          ],
        }),
        // DynamoDB full permissions
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'dynamodb:*',
          ],
          resources: [
            dynamoTable.tableArn,
            `${dynamoTable.tableArn}/index/*`,
          ],
        }),
        // API Gateway permissions
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'apigateway:GET',
            'apigateway:POST',
            'apigateway:PUT',
            'apigateway:DELETE',
          ],
          resources: ['*'],
        }),
        // CloudWatch Logs full permissions for project logs
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'logs:*',
          ],
          resources: ['*'],
        }),
      ],
    });

    const adminPermissionSet = new sso.CfnPermissionSet(this, 'AdminPermissionSet', {
      name: `${prefix}-${env}-Admin`,
      description: `Admin access for ${prefix} ${env} environment`,
      instanceArn: ssoInstanceArn,
      sessionDuration: 'PT12H', // 12 hour session
      inlinePolicy: adminPolicy.toJSON(),
    });

    // Note: In a real-world scenario, you would assign these permission sets to specific
    // users or groups in your IAM Identity Center directory. This requires knowing the
    // principal IDs (users/groups) in advance or retrieving them programmatically.
    // 
    // Example of how to assign permission sets (commented out as it requires actual principal IDs):
    /*
    // Assign read-only permission set to a group
    new sso.CfnAssignment(this, 'ReadOnlyGroupAssignment', {
      instanceArn: ssoInstanceArn,
      permissionSetArn: readOnlyPermissionSet.attrPermissionSetArn,
      principalId: 'group-id-from-identity-store',
      principalType: 'GROUP',
      targetId: this.account,
      targetType: 'AWS_ACCOUNT',
    });

    // Assign developer permission set to a group
    new sso.CfnAssignment(this, 'DeveloperGroupAssignment', {
      instanceArn: ssoInstanceArn,
      permissionSetArn: developerPermissionSet.attrPermissionSetArn,
      principalId: 'group-id-from-identity-store',
      principalType: 'GROUP',
      targetId: this.account,
      targetType: 'AWS_ACCOUNT',
    });

    // Assign admin permission set to a specific user
    new sso.CfnAssignment(this, 'AdminUserAssignment', {
      instanceArn: ssoInstanceArn,
      permissionSetArn: adminPermissionSet.attrPermissionSetArn,
      principalId: 'user-id-from-identity-store',
      principalType: 'USER',
      targetId: this.account,
      targetType: 'AWS_ACCOUNT',
    });
    */
  }
}
