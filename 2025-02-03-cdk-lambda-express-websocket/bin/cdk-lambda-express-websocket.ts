#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkLambdaExpressWebsocketStack } from '../lib/cdk-lambda-express-websocket-stack';

const app = new cdk.App();
new CdkLambdaExpressWebsocketStack(app, 'CdkLambdaExpressWebsocketStack');
