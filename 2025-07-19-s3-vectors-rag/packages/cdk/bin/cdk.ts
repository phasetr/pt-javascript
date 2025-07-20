/**
 * @fileoverview CDK アプリケーションのエントリーポイント
 *
 * このファイルは、S3Vectors RAGシステムのAWS CDKアプリケーションのメインエントリーポイントです。
 * CDKスタックをインスタンス化し、AWSリソースをデプロイするためのアプリケーションを定義します。
 */

// import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack.js';

// CDKアプリケーションを作成
const app = new cdk.App();

// S3Vectors RAGシステムのスタックを作成
new CdkStack(app, 'MadeinabyssS3VectorsRagTypeScriptStack', {
  description: 'S3Vectors RAG System with TypeScript Lambda functions',
});
