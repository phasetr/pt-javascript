#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CbalStack } from '../lib/cbal-stack';

const app = new cdk.App();
// 環境名を取得（デフォルトは 'dev'）
const environment = app.node.tryGetContext('environment') || 'dev';
// 環境ごとにスタック名を変える
new CbalStack(app, `CbalStack-${environment}`, {
  env: {
    region: 'ap-northeast-1'
  },
  tags: {
    Environment: environment
  }
});
