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

// Create stack for the specified environment
new CiicStack(app, `CIIC-${environment}-Stack`, {
  environment: environment as 'dev' | 'prod',
  // Add environment-specific tags
  tags: {
    Environment: environment,
    Project: 'CIIC',
  },
});
