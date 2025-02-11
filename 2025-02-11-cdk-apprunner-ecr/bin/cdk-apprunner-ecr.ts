#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkApprunnerEcrStack } from '../lib/cdk-apprunner-ecr-stack';

const app = new cdk.App();
new CdkApprunnerEcrStack(app, 'CdkApprunnerEcrStack');
