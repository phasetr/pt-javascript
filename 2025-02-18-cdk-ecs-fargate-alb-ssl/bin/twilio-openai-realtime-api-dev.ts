#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { TwilioOpenaiRealtimeApiDevStack } from "../lib/twilio-openai-realtime-api-dev-stack";

const app = new cdk.App();
new TwilioOpenaiRealtimeApiDevStack(app, "CdkEcsFargateAlbSslStack", {
	env: {
		account: process.env.CDK_DEFAULT_ACCOUNT,
		region: process.env.CDK_DEFAULT_REGION,
	},
});
