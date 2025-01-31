#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkLambdaWebsocketStack } from '../lib/cdk-lambda-websocket-stack';

const app = new cdk.App();
new CdkLambdaWebsocketStack(app, 'CdkLambdaWebsocketStack');
