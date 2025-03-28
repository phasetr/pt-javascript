#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CbulStack } from '../lib/cbul-stack';

const app = new cdk.App();
new CbulStack(app, 'CbulStack');
