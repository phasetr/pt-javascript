#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkLambdaTsStack } from '../lib/cdk-lambda-ts-stack';

const app = new cdk.App();
new CdkLambdaTsStack(app, 'CdkLambdaTsStack');
