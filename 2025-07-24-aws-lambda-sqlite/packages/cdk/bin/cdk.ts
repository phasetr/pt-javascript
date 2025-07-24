#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AwsLambdaSqliteStack } from "../lib/aws-lambda-sqlite-stack";

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || "ap-northeast-1";

new AwsLambdaSqliteStack(app, "AwsLambdaSqliteStack", {
	env: account ? { account, region } : { region },
	description: "AWS Lambda with SQLite on EFS experimental stack",
	stackName: "aws-lambda-sqlite-efs-stack",
});

app.synth();
