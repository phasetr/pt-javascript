/**
 * @fileoverview S3Vectors RAGシステム用のAWS CDKスタック定義
 *
 * このモジュールは、S3Vectorsベースの質問回答システムのためのAWSインフラストラクチャを定義します。
 * Lambda関数、API Gateway、S3バケット、IAMロールを含む完全なRAGシステムを構築します。
 */

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import type { Construct } from 'constructs';

/**
 * S3Vectors RAGシステム用のCDKスタック
 *
 * ベクター検索ベースの質問回答システムに必要なAWSリソースを定義します。
 * Lambda関数、API Gateway、S3Vectorsバケット、および適切なIAM権限を作成します。
 *
 * @class CdkStack
 * @extends {cdk.Stack}
 */
export class CdkStack extends cdk.Stack {
  /**
   * CDKスタックのコンストラクタ
   *
   * S3Vectors RAGシステムの完全なインフラストラクチャを構築します：
   * 1. ベクター保存用のS3バケット
   * 2. Lambda実行用のIAMロール（Bedrock/S3Vectors権限付き）
   * 3. 質問回答処理用のLambda関数
   * 4. RESTful API用のAPI Gateway
   * 5. エンドポイントとバケット名の出力
   *
   * すべてのリソースはus-east-1リージョンに作成されます。
   *
   * @param {Construct} scope - CDKアプリケーションまたは上位レベルのコンストラクト
   * @param {string} id - このスタックの一意識別子
   * @param {cdk.StackProps} [props] - スタック設定プロパティ（オプション）
   *
   * @example
   * ```typescript
   * const app = new cdk.App();
   * new CdkStack(app, 'S3VectorsRagStack');
   * ```
   */
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, { ...props, env: { region: 'us-east-1' } });

    // ベクター用のS3バケット（CDKが一意の名前を自動生成）
    const vectorBucket = new s3.Bucket(this, 'VectorBucket', {
      // removalPolicy: cdk.RemovalPolicy.DESTROY, // 本番環境では非推奨
      // autoDeleteObjects: true, // 本番環境では非推奨
    });

    // Lambda関数用のIAMロール
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      roleName: 'madeinabyss-s3vectors-search-function-role-cdk',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // LambdaロールにBedrockとS3Vectors権限を追加
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
          's3vectors:GetVectors',
          's3vectors:QueryVectors',
        ],
        resources: ['*'], // 可能であれば特定のリソースに調整
      })
    );

    // Lambda関数（TypeScript）
    const madeinabyssS3vectorsSearchFunction = new lambda.Function(
      this,
      'MadeinabyssS3vectorsSearchFunction',
      {
        functionName: 'madeinabyss-s3vectors-search-function-cdk',
        code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/dist')),
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        timeout: cdk.Duration.seconds(301),
        environment: {
          VECTOR_BUCKET_NAME: vectorBucket.bucketName,
          VECTOR_INDEX_NAME: 'madeinabyss-s3vectors-search-index',
        },
        role: lambdaRole,
      }
    );

    // API Gateway
    const api = new apigw.LambdaRestApi(this, 'MadeinabyssS3vectorsSearchApiGateway', {
      restApiName: 'madeinabyss-s3vectors-search-api-cdk',
      handler: madeinabyssS3vectorsSearchFunction,
      proxy: true, // Lambda関数用のキャッチオールプロキシリソースを作成
      deployOptions: {
        stageName: 'v1',
      },
    });

    new cdk.CfnOutput(this, 'ApiGatewayEndpoint', {
      value: api.url,
      description: 'The URL of the API Gateway endpoint',
    });

    new cdk.CfnOutput(this, 'VectorBucketName', {
      value: vectorBucket.bucketName,
      description: 'The name of the S3 Vector bucket',
    });
  }
}
