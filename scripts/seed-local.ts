import { DynamoDBClient, CreateTableCommand, DescribeTableCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const isLocal = process.argv.includes("--local");

const client = new DynamoDBClient({
  region: "ap-northeast-1",
  ...(isLocal && {
    endpoint: "http://localhost:8000",
    credentials: { accessKeyId: "dummy", secretAccessKey: "dummy" },
  }),
});
const docClient = DynamoDBDocumentClient.from(client);

const PREFIX = "kick-summit";
const TABLES = {
  events: `${PREFIX}-events`,
  groups: `${PREFIX}-groups`,
  teams: `${PREFIX}-teams`,
  matches: `${PREFIX}-matches`,
  brackets: `${PREFIX}-brackets`,
  courts: `${PREFIX}-courts`,
};

const EVENT_ID = "default";

console.log(`ターゲット: ${isLocal ? "ローカル (localhost:8000)" : "AWS リモート"}\n`);

async function recreateTable(name: string, keySchema: { hash: string; range?: string }, gsiList?: { name: string; hash: string; range?: string }[]) {
  try {
    await client.send(new DescribeTableCommand({ TableName: name }));
    console.log(`  ${name}: 削除中...`);
    await client.send(new DeleteTableCommand({ TableName: name }));
  } catch {
    // テーブルが存在しない
  }

  const attrs = new Map<string, string>();
  attrs.set(keySchema.hash, "S");
  if (keySchema.range) attrs.set(keySchema.range, "S");
  for (const gsi of gsiList ?? []) {
    attrs.set(gsi.hash, "S");
    if (gsi.range) attrs.set(gsi.range, "S");
  }

  console.log(`  ${name}: 作成中...`);
  await client.send(
    new CreateTableCommand({
      TableName: name,
      AttributeDefinitions: [...attrs.entries()].map(([name, type]) => ({
        AttributeName: name,
        AttributeType: type,
      })),
      KeySchema: [
        { AttributeName: keySchema.hash, KeyType: "HASH" },
        ...(keySchema.range ? [{ AttributeName: keySchema.range, KeyType: "RANGE" }] : []),
      ],
      BillingMode: "PAY_PER_REQUEST",
      ...(gsiList && gsiList.length > 0 && {
        GlobalSecondaryIndexes: gsiList.map((gsi) => ({
          IndexName: gsi.name,
          KeySchema: [
            { AttributeName: gsi.hash, KeyType: "HASH" as const },
            ...(gsi.range ? [{ AttributeName: gsi.range, KeyType: "RANGE" as const }] : []),
          ],
          Projection: { ProjectionType: "ALL" as const },
        })),
      }),
    }),
  );
}

async function put(table: string, item: Record<string, unknown>) {
  await docClient.send(new PutCommand({ TableName: table, Item: item }));
}

async function seed() {
  console.log("\n=== テーブル再作成 ===");
  await recreateTable(TABLES.events, { hash: "id" });
  await recreateTable(TABLES.groups, { hash: "id" }, [{ name: "eventId-index", hash: "eventId" }]);
  await recreateTable(TABLES.teams, { hash: "id" }, [{ name: "eventId-index", hash: "eventId" }, { name: "groupId-index", hash: "groupId" }]);
  await recreateTable(TABLES.matches, { hash: "id" }, [{ name: "schedule-index", hash: "eventId", range: "scheduledTime" }, { name: "group-index", hash: "groupId" }]);
  await recreateTable(TABLES.brackets, { hash: "id" }, [{ name: "eventId-index", hash: "eventId" }]);
  await recreateTable(TABLES.courts, { hash: "id" }, [{ name: "eventId-index", hash: "eventId" }]);

  console.log("\n=== 大会情報 ===");
  await put(TABLES.events, {
    id: EVENT_ID,
    name: "Kick Summit 2026",
    date: "2026-03-15",
    passwordHash: "admin",
    description: "",
    courtFee: 0,
    partyFeePerPerson: 0,
  });

  console.log("=== コート ===");
  await put(TABLES.courts, { id: "c1", eventId: EVENT_ID, name: "コート1" });
  await put(TABLES.courts, { id: "c2", eventId: EVENT_ID, name: "コート2" });

  console.log("=== グループ ===");
  await put(TABLES.groups, { id: "gA", eventId: EVENT_ID, name: "グループA" });
  await put(TABLES.groups, { id: "gB", eventId: EVENT_ID, name: "グループB" });

  console.log("=== チーム ===");
  const teams = [
    { id: "t1", name: "FC Thunder",     groupId: "gA", color: "#ef4444" },
    { id: "t2", name: "Blue Sharks",    groupId: "gA", color: "#3b82f6" },
    { id: "t3", name: "Green Vipers",   groupId: "gA", color: "#22c55e" },
    { id: "t4", name: "Silver Wolves",  groupId: "gA", color: "#6b7280" },
    { id: "t5", name: "Golden Eagles",  groupId: "gB", color: "#eab308" },
    { id: "t6", name: "Purple Storm",   groupId: "gB", color: "#a855f7" },
    { id: "t7", name: "Red Phoenix",    groupId: "gB", color: "#f97316" },
    { id: "t8", name: "Black Panthers", groupId: "gB", color: "#171717" },
  ];
  for (const t of teams) {
    await put(TABLES.teams, {
      ...t,
      eventId: EVENT_ID,
      partyCount: 0,
      receiptName: "",
    });
    console.log(`  ${t.name} (${t.groupId})`);
  }

  console.log("\n✓ シード完了 (パスワード: admin)");
}

seed().catch(console.error);
