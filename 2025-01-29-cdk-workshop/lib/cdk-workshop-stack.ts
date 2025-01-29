import { CfnOutput, Stack, type StackProps } from 'aws-cdk-lib';
import { Code, Function as LambdaFunction, Runtime } from "aws-cdk-lib/aws-lambda";
import type { Construct } from 'constructs';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';

export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // defines an AWS Lambda resource
    const hello = new LambdaFunction(this, 'HelloHandler', {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('lambda'),
      handler: 'hello.handler',
    });

    // defines an API Gateway REST API resource backed by our "hello" function.
    const api = new LambdaRestApi(this, 'Endpoint', {
      handler: hello,
    });

    // outputs the URL of the deployed API Gateway REST API
    new CfnOutput(this, 'myApiGatewayUrlOutput', {
      value: api.url,
      description: 'my function URL',
      exportName: 'myApiGatewayUrl',
    });
  }
}
