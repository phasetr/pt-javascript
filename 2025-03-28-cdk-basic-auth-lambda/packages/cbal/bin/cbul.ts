#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CbalStack } from '../lib/cbal-stack';

const app = new cdk.App();
new CbalStack(app, 'CbalStack');
