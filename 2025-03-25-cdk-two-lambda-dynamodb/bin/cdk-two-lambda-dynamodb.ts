#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkTwoLambdaDynamodbStack } from '../lib/cdk-two-lambda-dynamodb-stack';

const app = new cdk.App();
new CdkTwoLambdaDynamodbStack(app, 'CdkTwoLambdaDynamodbStack');
