#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CiicStack } from '../lib/ciic-stack';

const app = new cdk.App();
new CiicStack(app, 'CiicStack');
