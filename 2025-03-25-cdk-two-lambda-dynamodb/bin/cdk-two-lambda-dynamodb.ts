#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkTwoLambdaDynamodbStack } from '../lib/cdk-two-lambda-dynamodb-stack';

const app = new cdk.App();
const env = app.node.tryGetContext('env') || 'dev';

// 環境ごとの設定
const envSettings: Record<string, {
  stackName: string;
  tags: Record<string, string>;
}> = {
  dev: {
    stackName: 'CdkTwoLambdaDynamodbStack-Dev',
    tags: {
      Environment: 'Development',
      Project: 'CTLD'
    }
  },
  prod: {
    stackName: 'CdkTwoLambdaDynamodbStack-Prod',
    tags: {
      Environment: 'Production',
      Project: 'CTLD'
    }
  }
};

// 指定された環境の設定を取得
const settings = envSettings[env];
if (!settings) {
  throw new Error(`Unknown environment: ${env}. Supported environments are: ${Object.keys(envSettings).join(', ')}`);
}

// 環境名をアプリケーションのコンテキストに設定
app.node.setContext('environment', env);

// 環境固有のスタックを作成
new CdkTwoLambdaDynamodbStack(app, settings.stackName, {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
  tags: settings.tags,
  // 環境名をスタックに渡す
  stackName: settings.stackName,
  description: `CTLD Stack for ${env} environment`,
  // 環境名を追加のプロパティとして渡す
});
