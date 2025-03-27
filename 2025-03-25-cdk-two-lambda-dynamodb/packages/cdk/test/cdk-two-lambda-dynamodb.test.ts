import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as CdkTwoLambdaDynamodb from '../lib/cdk-two-lambda-dynamodb-stack';

test('DynamoDB Table and Lambda Functions Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new CdkTwoLambdaDynamodb.CdkTwoLambdaDynamodbStack(app, 'MyTestStack');
  // THEN

  const template = Template.fromStack(stack);

  // Verify DynamoDB table is created
  template.resourceCountIs('AWS::DynamoDB::Table', 1);
  
  // Verify Lambda functions are created
  template.resourceCountIs('AWS::Lambda::Function', 2);
  
  // Verify API Gateway is created
  template.resourceCountIs('AWS::ApiGatewayV2::Api', 2);
});
