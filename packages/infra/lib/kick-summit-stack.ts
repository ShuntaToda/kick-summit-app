import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigwv2Integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as path from "path";
import type { Construct } from "constructs";

export class KickSummitStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ==========================================
    // DynamoDB シングルテーブル
    // ==========================================
    const table = new dynamodb.Table(this, "FutsalTournamentTable", {
      tableName: "futsal-tournament",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // GSI: ステータス + 時刻でタイムテーブル取得用
    table.addGlobalSecondaryIndex({
      indexName: "status-scheduledTime-index",
      partitionKey: { name: "status", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "scheduledTime", type: dynamodb.AttributeType.STRING },
    });

    // ==========================================
    // Lambda (Next.js + Lambda Web Adapter)
    // ==========================================
    const webFunction = new lambda.DockerImageFunction(this, "WebFunction", {
      code: lambda.DockerImageCode.fromImageAsset(
        path.join(__dirname, "..", "..", ".."), // monorepo root
        {
          file: "packages/web/Dockerfile",
          exclude: ["packages/infra", "cdk.out"],
        }
      ),
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      architecture: lambda.Architecture.ARM_64,
      environment: {
        AWS_LWA_PORT: "8080",
        AWS_LWA_READINESS_CHECK_PATH: "/",
        TABLE_NAME: table.tableName,
      },
    });

    // Lambda に DynamoDB の読み書き権限を付与
    table.grantReadWriteData(webFunction);

    // ==========================================
    // API Gateway (HTTP API)
    // ==========================================
    const httpApi = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: "kick-summit-api",
      defaultIntegration: new apigwv2Integrations.HttpLambdaIntegration(
        "LambdaIntegration",
        webFunction
      ),
    });

    // ==========================================
    // Outputs
    // ==========================================
    new cdk.CfnOutput(this, "ApiUrl", {
      value: httpApi.url ?? "",
      description: "API Gateway URL",
    });

    new cdk.CfnOutput(this, "TableName", {
      value: table.tableName,
      description: "DynamoDB Table Name",
    });
  }
}
