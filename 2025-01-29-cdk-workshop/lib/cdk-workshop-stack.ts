import { Stack, type StackProps } from 'aws-cdk-lib';
import { Code, Function as LambdaFunction, Runtime } from "aws-cdk-lib/aws-lambda";
import type { Construct } from 'constructs';

export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // defines an AWS Lambda resource
    const hello = new LambdaFunction(this, 'HelloHandler', {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('lambda'),
      handler: 'hello.handler',
    });
  }
}
