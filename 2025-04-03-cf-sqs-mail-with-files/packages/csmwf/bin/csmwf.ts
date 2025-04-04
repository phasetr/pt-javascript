#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CsmwfStack } from '../lib/csmwf-stack';

const app = new cdk.App();
const env = app.node.tryGetContext('env') || 'prod';

new CsmwfStack(app, `CSMWF-${env}-Stack`, {
  environment: env,
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
  },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
