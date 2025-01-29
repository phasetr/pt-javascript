#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkLambdaFastifyStack } from '../lib/cdk-lambda-fastify-stack';

const app = new cdk.App();
new CdkLambdaFastifyStack(app, 'CdkLambdaFastifyStack');
