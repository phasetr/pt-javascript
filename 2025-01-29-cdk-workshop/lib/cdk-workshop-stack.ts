import { CfnOutput, Stack, type StackProps } from 'aws-cdk-lib';
import { Code, Function as LambdaFunction, Runtime } from "aws-cdk-lib/aws-lambda";
import type { Construct } from 'constructs';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { HitCounter } from './hitcounter';

export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // defines an AWS Lambda resource
    const hello = new LambdaFunction(this, 'HelloHandler', {
      runtime: Runtime.NODEJS_18_X, // execution environment
      code: Code.fromAsset('lambda'), // code loaded from "lambda" directory
      handler: 'hello.handler', // file is "hello", function is "handler"
    });

    const helloWithCounter = new HitCounter(this, 'HelloHitCounter', {
      downstream: hello,
    });

    // defines an API Gateway REST API resource backed by our "hello" function.
    const gateway = new LambdaRestApi(this, 'Endpoint', {
      handler: helloWithCounter.handler,
    });

    // outputs the URL of the deployed API Gateway REST API
    new CfnOutput(this, 'myApiGatewayUrlOutput', {
      value: gateway.url,
      description: 'my function URL',
      exportName: 'myApiGatewayUrl',
    });
  }
}
