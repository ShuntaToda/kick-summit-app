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

    const prefix = "kick-summit";

    // ==========================================
    // DynamoDB Tables
    // ==========================================

    // --- Events ---
    const eventsTable = new dynamodb.Table(this, "EventsTable", {
      tableName: `${prefix}-events`,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // --- Groups ---
    const groupsTable = new dynamodb.Table(this, "GroupsTable", {
      tableName: `${prefix}-groups`,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    groupsTable.addGlobalSecondaryIndex({
      indexName: "eventId-index",
      partitionKey: { name: "eventId", type: dynamodb.AttributeType.STRING },
    });

    // --- Courts ---
    const courtsTable = new dynamodb.Table(this, "CourtsTable", {
      tableName: `${prefix}-courts`,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    courtsTable.addGlobalSecondaryIndex({
      indexName: "eventId-index",
      partitionKey: { name: "eventId", type: dynamodb.AttributeType.STRING },
    });

    // --- Teams ---
    const teamsTable = new dynamodb.Table(this, "TeamsTable", {
      tableName: `${prefix}-teams`,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    teamsTable.addGlobalSecondaryIndex({
      indexName: "eventId-index",
      partitionKey: { name: "eventId", type: dynamodb.AttributeType.STRING },
    });

    teamsTable.addGlobalSecondaryIndex({
      indexName: "groupId-index",
      partitionKey: { name: "groupId", type: dynamodb.AttributeType.STRING },
    });

    // --- Matches ---
    const matchesTable = new dynamodb.Table(this, "MatchesTable", {
      tableName: `${prefix}-matches`,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    matchesTable.addGlobalSecondaryIndex({
      indexName: "schedule-index",
      partitionKey: { name: "eventId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "scheduledTime", type: dynamodb.AttributeType.STRING },
    });

    matchesTable.addGlobalSecondaryIndex({
      indexName: "group-index",
      partitionKey: { name: "groupId", type: dynamodb.AttributeType.STRING },
    });

    // --- Brackets ---
    const bracketsTable = new dynamodb.Table(this, "BracketsTable", {
      tableName: `${prefix}-brackets`,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    bracketsTable.addGlobalSecondaryIndex({
      indexName: "eventId-index",
      partitionKey: { name: "eventId", type: dynamodb.AttributeType.STRING },
    });

    const allTables = [eventsTable, groupsTable, courtsTable, teamsTable, matchesTable, bracketsTable];

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
        TABLE_PREFIX: prefix,
      },
    });

    // Lambda に全テーブルの読み書き権限を付与
    for (const table of allTables) {
      table.grantReadWriteData(webFunction);
    }

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

    new cdk.CfnOutput(this, "TablePrefix", {
      value: prefix,
      description: "DynamoDB Table Prefix",
    });
  }
}
