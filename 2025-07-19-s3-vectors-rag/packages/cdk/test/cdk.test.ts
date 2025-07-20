import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { CdkStack } from '../lib/cdk-stack.js';

describe('CdkStack', () => {
  function createTestStack() {
    const app = new App();
    return new CdkStack(app, 'TestStack');
  }

  function createTemplate() {
    const stack = createTestStack();
    return Template.fromStack(stack);
  }

  describe('S3 Bucket', () => {
    it('should create VectorBucket', () => {
      const template = createTemplate();

      template.hasResource('AWS::S3::Bucket', {});
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });
  });

  describe('IAM Role', () => {
    it('should create Lambda execution role with correct name', () => {
      const template = createTemplate();

      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'madeinabyss-s3vectors-search-function-role-cdk',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              ],
            ],
          },
        ],
      });
    });

    it('should have Bedrock and S3Vectors permissions', () => {
      const template = createTemplate();

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Action: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
                's3vectors:GetVectors',
                's3vectors:QueryVectors',
              ],
              Effect: 'Allow',
              Resource: '*',
            },
          ],
        },
      });
    });
  });

  describe('Lambda Function', () => {
    it('should create Lambda function with correct configuration', () => {
      const template = createTemplate();

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'madeinabyss-s3vectors-search-function-cdk',
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 301,
      });
    });

    it('should have correct environment variables', () => {
      const template = createTemplate();

      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            VECTOR_INDEX_NAME: 'madeinabyss-s3vectors-search-index',
          },
        },
      });
    });
  });

  describe('API Gateway', () => {
    it('should create API Gateway with correct configuration', () => {
      const template = createTemplate();

      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'madeinabyss-s3vectors-search-api-cdk',
      });
    });

    it('should create deployment with v1 stage', () => {
      const template = createTemplate();

      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'v1',
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    it('should have API Gateway endpoint output', () => {
      const template = createTemplate();

      template.hasOutput('ApiGatewayEndpoint', {
        Description: 'The URL of the API Gateway endpoint',
      });
    });

    it('should have Vector Bucket name output', () => {
      const template = createTemplate();

      template.hasOutput('VectorBucketName', {
        Description: 'The name of the S3 Vector bucket',
      });
    });
  });

  describe('Resource Count Validation', () => {
    it('should create exactly expected number of resources', () => {
      const template = createTemplate();

      template.resourceCountIs('AWS::S3::Bucket', 1);
      // API Gateway creates additional IAM role for service integration
      template.resourceCountIs('AWS::IAM::Role', 2);
      template.resourceCountIs('AWS::Lambda::Function', 1);
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });
  });

  describe('Stack Properties', () => {
    it('should set correct region', () => {
      const stack = createTestStack();
      expect(stack.region).toBe('us-east-1');
    });

    it('should be able to synthesize template', () => {
      const template = createTemplate();
      const templateJson = template.toJSON();

      expect(templateJson).toBeDefined();
      expect(templateJson.Resources).toBeDefined();
      expect(Object.keys(templateJson.Resources).length).toBeGreaterThan(0);
    });
  });

  describe('CDK App Integration', () => {
    it('should instantiate app and stack without errors', () => {
      const app = new App();
      const stack = new CdkStack(app, 'TestIntegrationStack');

      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestIntegrationStack');
      expect(app.node.children).toContain(stack);
    });
  });
});
