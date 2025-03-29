import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CbalStack } from '../lib/cbal-stack';

// Mock dotenv.config() to avoid loading .env files during tests
vi.mock('dotenv', () => ({
  config: vi.fn(),
}));

describe('CbalStack', () => {
  let app: cdk.App;
  let stack: CbalStack;
  let template: Template;

  beforeEach(() => {
    // Create a new CDK app for each test
    app = new cdk.App({
      context: {
        environment: 'dev', // Set default environment for tests
      },
    });
    
    // Create the stack
    stack = new CbalStack(app, 'TestStack', {
      env: { region: 'ap-northeast-1' },
    });
    
    // Get the CloudFormation template
    template = Template.fromStack(stack);
  });

  it('creates a DynamoDB table with the correct configuration', () => {
    // Verify the DynamoDB table exists
    template.resourceCountIs('AWS::DynamoDB::Table', 1);
    
    // Verify specific properties individually
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      KeySchema: [
        {
          AttributeName: 'id',
          KeyType: 'HASH',
        },
      ],
    });
    
    // Verify it has the userId GSI
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: [
        {
          KeySchema: [
            {
              AttributeName: 'userId',
              KeyType: 'HASH',
            },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
        },
      ],
    });
  });

  it('creates Secrets Manager secrets for app config and basic auth', () => {
    // Verify the app config secret is created
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'CBAL-dev/AppConfig',
      Description: 'アプリケーション設定',
      GenerateSecretString: {
        SecretStringTemplate: JSON.stringify({
          environment: 'dev',
          region: 'ap-northeast-1',
          stage: 'development',
        }),
        GenerateStringKey: 'key',
      },
    });

    // Verify the basic auth secret is created
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'CBAL-dev/BasicAuth',
      Description: 'Basic認証の認証情報',
      GenerateSecretString: {
        SecretStringTemplate: JSON.stringify({
          username: 'admin',
          password: 'password',
        }),
        GenerateStringKey: 'key',
      },
    });
  });

  it('creates a Lambda function with the correct configuration', () => {
    // Verify the Lambda function exists
    template.resourceCountIs('AWS::Lambda::Function', 1);
    
    // Verify specific properties individually
    template.hasResourceProperties('AWS::Lambda::Function', {
      MemorySize: 512,
      Timeout: 30,
      Architectures: ['arm64'],
    });
    
    // Verify it has environment variables
    const lambdaProps = template.findResources('AWS::Lambda::Function');
    const lambdaKey = Object.keys(lambdaProps)[0];
    const lambda = lambdaProps[lambdaKey];
    
    expect(lambda.Properties.Environment.Variables).toHaveProperty('APP_CONFIG_SECRET_NAME');
    expect(lambda.Properties.Environment.Variables).toHaveProperty('BASIC_AUTH_SECRET_NAME');
  });

  it('creates an API Gateway connected to the Lambda function', () => {
    // Verify the API Gateway is created
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    
    // Verify the API Gateway has a deployment
    template.resourceCountIs('AWS::ApiGateway::Deployment', 1);
    
    // Verify the API Gateway has a stage
    template.resourceCountIs('AWS::ApiGateway::Stage', 1);
  });

  it('outputs the API Gateway endpoint URL', () => {
    // Verify there is an output for the API Gateway endpoint URL
    template.hasOutput('*', {
      Description: 'API Gateway endpoint URL',
    });
  });

  it('creates resources with the correct environment-specific configuration', () => {
    // Create a new app with prod environment
    const prodApp = new cdk.App({
      context: {
        environment: 'prod',
      },
    });
    
    // Create the stack with prod environment
    const prodStack = new CbalStack(prodApp, 'TestProdStack', {
      env: { region: 'ap-northeast-1' },
    });
    
    // Get the CloudFormation template for the prod stack
    const prodTemplate = Template.fromStack(prodStack);
    
    // Verify the Lambda function has the correct timeout for prod
    prodTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Timeout: 60, // Prod timeout is 60 seconds
    });
    
    // Verify the app config secret exists with the correct name
    prodTemplate.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'CBAL-prod/AppConfig',
    });
    
    // Verify the secret string template contains the prod environment
    const secretProps = prodTemplate.findResources('AWS::SecretsManager::Secret');
    const secretKeys = Object.keys(secretProps);
    
    // Find the AppConfig secret
    const appConfigSecret = secretKeys.find(key => 
      secretProps[key].Properties.Name === 'CBAL-prod/AppConfig'
    );
    
    if (appConfigSecret) {
      const secretStringTemplate = secretProps[appConfigSecret].Properties.GenerateSecretString.SecretStringTemplate;
      expect(secretStringTemplate).toContain('"environment":"prod"');
    } else {
      throw new Error('AppConfig secret not found');
    }
  });
});
