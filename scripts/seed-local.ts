import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
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

const TABLE = "futsal-tournament";
const PK = "TOURNAMENT#default";

console.log(`ターゲット: ${isLocal ? "ローカル (localhost:8000)" : "AWS リモート"}\n`);

async function ensureTable() {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE }));
    console.log("テーブルは既に存在します");
  } catch {
    if (!isLocal) {
      console.error("リモートにテーブルが存在しません。CDKでデプロイしてください。");
      process.exit(1);
    }
    console.log("テーブルを作成中...");
    await client.send(
      new CreateTableCommand({
        TableName: TABLE,
        AttributeDefinitions: [
          { AttributeName: "PK", AttributeType: "S" },
          { AttributeName: "SK", AttributeType: "S" },
          { AttributeName: "status", AttributeType: "S" },
          { AttributeName: "scheduledTime", AttributeType: "S" },
        ],
        KeySchema: [
          { AttributeName: "PK", KeyType: "HASH" },
          { AttributeName: "SK", KeyType: "RANGE" },
        ],
        BillingMode: "PAY_PER_REQUEST",
        GlobalSecondaryIndexes: [
          {
            IndexName: "status-scheduledTime-index",
            KeySchema: [
              { AttributeName: "status", KeyType: "HASH" },
              { AttributeName: "scheduledTime", KeyType: "RANGE" },
            ],
            Projection: { ProjectionType: "ALL" },
          },
        ],
      })
    );
    console.log("テーブル作成完了");
  }
}

async function put(item: Record<string, unknown>) {
  await docClient.send(new PutCommand({ TableName: TABLE, Item: { PK, ...item } }));
}

async function seed() {
  console.log("\n=== 大会情報 ===");
  await put({ SK: "METADATA", id: "default", name: "Kick Summit 2026", date: "2026-03-15", passwordHash: "admin" });

  console.log("=== チーム ===");
  await put({ SK: "TEAM#t1", id: "t1", name: "FC Thunder",    group: "A", color: "#ef4444" });
  await put({ SK: "TEAM#t2", id: "t2", name: "Blue Sharks",   group: "A", color: "#3b82f6" });
  await put({ SK: "TEAM#t3", id: "t3", name: "Green Vipers",  group: "A", color: "#22c55e" });
  await put({ SK: "TEAM#t4", id: "t4", name: "Golden Eagles", group: "B", color: "#eab308" });
  await put({ SK: "TEAM#t5", id: "t5", name: "Purple Storm",  group: "B", color: "#a855f7" });
  await put({ SK: "TEAM#t6", id: "t6", name: "Red Phoenix",   group: "B", color: "#f97316" });

  console.log("=== 予選リーグ (グループA) ===");
  await put({ SK: "MATCH#m1", id: "m1", type: "league", group: "A", teamAId: "t1", teamBId: "t2", scoreA: 3, scoreB: 1, halfScoreA: 1, halfScoreB: 0, scheduledTime: "2026-03-15T10:00:00", court: "コート1", status: "finished" });
  await put({ SK: "MATCH#m2", id: "m2", type: "league", group: "A", teamAId: "t2", teamBId: "t3", scoreA: 2, scoreB: 2, halfScoreA: 1, halfScoreB: 1, scheduledTime: "2026-03-15T10:30:00", court: "コート2", status: "finished" });
  await put({ SK: "MATCH#m3", id: "m3", type: "league", group: "A", teamAId: "t1", teamBId: "t3", scoreA: null, scoreB: null, halfScoreA: null, halfScoreB: null, scheduledTime: "2026-03-15T11:00:00", court: "コート1", status: "scheduled" });

  console.log("=== 予選リーグ (グループB) ===");
  await put({ SK: "MATCH#m4", id: "m4", type: "league", group: "B", teamAId: "t4", teamBId: "t5", scoreA: 0, scoreB: 1, halfScoreA: 0, halfScoreB: 0, scheduledTime: "2026-03-15T10:00:00", court: "コート2", status: "finished" });
  await put({ SK: "MATCH#m5", id: "m5", type: "league", group: "B", teamAId: "t5", teamBId: "t6", scoreA: null, scoreB: null, halfScoreA: null, halfScoreB: null, scheduledTime: "2026-03-15T10:30:00", court: "コート1", status: "ongoing" });
  await put({ SK: "MATCH#m6", id: "m6", type: "league", group: "B", teamAId: "t4", teamBId: "t6", scoreA: null, scoreB: null, halfScoreA: null, halfScoreB: null, scheduledTime: "2026-03-15T11:00:00", court: "コート2", status: "scheduled" });

  console.log("\n✓ シード完了 (パスワード: admin)");
}

async function main() {
  await ensureTable();
  await seed();
}

main().catch(console.error);
