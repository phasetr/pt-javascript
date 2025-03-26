import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as Ciic from '../lib/ciic-stack';

describe('CIIC Stack', () => {
  test('Dev Environment Resources Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Ciic.CiicStack(app, 'CIIC-dev-Stack', {
      environment: 'dev'
    });
    // THEN
    const template = Template.fromStack(stack);

    // Check DynamoDB Table
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'CIIC-dev-DDB',
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [
        {
          AttributeName: 'PK',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'SK',
          KeyType: 'RANGE'
        }
      ]
    });

    // Check Lambda Function
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'CIIC-dev-api',
      Runtime: 'nodejs20.x',
      Environment: {
        Variables: {
          TABLE_NAME: Match.anyValue(),
          ENVIRONMENT: 'dev'
        }
      }
    });

    // Check API Gateway
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'CIIC-dev-api'
    });

    // Check Global Secondary Index
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: [
        {
          IndexName: 'EntityIndex',
          KeySchema: [
            {
              AttributeName: 'entity',
              KeyType: 'HASH'
            },
            {
              AttributeName: 'id',
              KeyType: 'RANGE'
            }
          ]
        }
      ]
    });
  });

  test('Prod Environment Resources Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Ciic.CiicStack(app, 'CIIC-prod-Stack', {
      environment: 'prod'
    });
    // THEN
    const template = Template.fromStack(stack);

    // Check DynamoDB Table
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'CIIC-prod-DDB'
    });

    // Check Lambda Function
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'CIIC-prod-api',
      Environment: {
        Variables: {
          ENVIRONMENT: 'prod'
        }
      }
    });

    // Check API Gateway
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'CIIC-prod-api'
    });
  });
});
