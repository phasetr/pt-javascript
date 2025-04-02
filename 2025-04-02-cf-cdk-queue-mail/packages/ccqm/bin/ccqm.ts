#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CcqmStack } from "../lib/ccqm-stack";
import * as process from "node:process";

// プロジェクトの略称
const PREFIX = "CCQM";

// 環境の設定
const app = new cdk.App();
const environment = app.node.tryGetContext("env") || "dev";

// スタックの作成
new CcqmStack(app, `${PREFIX}-Stack-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "ap-northeast-1",
  },
  stackName: `${PREFIX}-Stack-${environment}`,
  description: `Cloudflare CDK Queue Mail Stack for ${environment} environment`,
  tags: {
    Environment: environment,
    Project: PREFIX,
  },
  // 環境情報をスタックに渡す
  context: {
    environment,
    prefix: PREFIX,
  },
});
