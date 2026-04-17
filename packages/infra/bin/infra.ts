#!/usr/bin/env node
import "dotenv/config";
import * as cdk from "aws-cdk-lib";
import { KickSummitStack } from "../lib/kick-summit-stack";

const stage = process.env.STAGE ?? "prod";
const stackName = stage === "prod" ? "KickSummitStack" : `KickSummitStack-${stage}`;
const prefix = stage === "prod" ? "kick-summit" : `kick-summit-${stage}`;

const app = new cdk.App();

new KickSummitStack(app, stackName, {
  prefix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "ap-northeast-1",
  },
});
