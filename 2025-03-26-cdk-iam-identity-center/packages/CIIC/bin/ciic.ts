#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CiicStack } from '../lib/ciic-stack';

const app = new cdk.App();

// Get environment from context or use default
const environment = app.node.tryGetContext('environment') || 'dev';

// Validate environment
if (environment !== 'dev' && environment !== 'prod') {
  throw new Error(`Invalid environment: ${environment}. Must be 'dev' or 'prod'`);
}

// Get IAM Identity Center parameters from context (optional)
const identityStoreId = app.node.tryGetContext('identityStoreId');
const ssoInstanceArn = app.node.tryGetContext('ssoInstanceArn');

// Create stack for the specified environment
new CiicStack(app, `CIIC-${environment}-Stack`, {
  environment: environment as 'dev' | 'prod',
  // Add IAM Identity Center parameters if provided
  ...(identityStoreId && ssoInstanceArn ? { identityStoreId, ssoInstanceArn } : {}),
  // Add environment-specific tags
  tags: {
    Environment: environment,
    Project: 'CIIC',
  },
});

// Log deployment instructions
console.log(`
Deployment Instructions:
------------------------
To deploy the stack with IAM Identity Center configuration, you need to provide:
- identityStoreId: The ID of your IAM Identity Center Identity Store
- ssoInstanceArn: The ARN of your IAM Identity Center instance

Example:
  pnpm cdk deploy CIIC-dev-Stack --context environment=dev --context identityStoreId=d-1234567890 --context ssoInstanceArn=arn:aws:sso:::instance/ssoins-1234567890abcdef

Without these parameters, the stack will be deployed without IAM Identity Center configuration.
`);
