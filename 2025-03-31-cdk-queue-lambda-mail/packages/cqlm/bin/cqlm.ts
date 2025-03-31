#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CqlmStack } from '../lib/cqlm-stack';

const app = new cdk.App();

// コマンドライン引数から環境を取得
// --context env=<環境名> の形式で指定可能
// 例: cdk deploy --context env=dev
const environment = app.node.tryGetContext('env') || 'dev';

// 環境ごとにスタックを作成
new CqlmStack(app, `CQLM-${environment}-Stack`, {
  environment,
  // 環境ごとにタグを設定
  tags: {
    Environment: environment,
    Project: 'CQLM',
    ManagedBy: 'CDK'
  }
});

// 出力にスタック情報を表示
console.log(`Deploying CQLM stack for environment: ${environment}`);
