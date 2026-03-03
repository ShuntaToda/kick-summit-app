import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "ap-northeast-1",
  endpoint: "http://localhost:8000",
  credentials: { accessKeyId: "dummy", secretAccessKey: "dummy" },
});
const docClient = DynamoDBDocumentClient.from(client);

const PREFIX = "kick-summit";
const TOURNAMENT_ID = "default";

interface TableDef {
  tableName: string;
  partitionKey: string;
  gsis?: { indexName: string; partitionKey: string; sortKey?: string }[];
}

const TABLES: TableDef[] = [
  {
    tableName: `${PREFIX}-tournaments`,
    partitionKey: "id",
  },
  {
    tableName: `${PREFIX}-groups`,
    partitionKey: "id",
    gsis: [
      { indexName: "tournamentId-index", partitionKey: "tournamentId" },
    ],
  },
  {
    tableName: `${PREFIX}-teams`,
    partitionKey: "id",
    gsis: [
      { indexName: "tournamentId-index", partitionKey: "tournamentId" },
      { indexName: "groupId-index", partitionKey: "groupId" },
    ],
  },
  {
    tableName: `${PREFIX}-matches`,
    partitionKey: "id",
    gsis: [
      { indexName: "schedule-index", partitionKey: "tournamentId", sortKey: "scheduledTime" },
      { indexName: "group-index", partitionKey: "groupId" },
    ],
  },
  {
    tableName: `${PREFIX}-brackets`,
    partitionKey: "id",
    gsis: [
      { indexName: "tournamentId-index", partitionKey: "tournamentId" },
    ],
  },
];

async function ensureTables() {
  for (const def of TABLES) {
    try {
      await client.send(new DescribeTableCommand({ TableName: def.tableName }));
      console.log(`✓ ${def.tableName} は既に存在します`);
    } catch {
      console.log(`  ${def.tableName} を作成中...`);

      const attrSet = new Set<string>();
      attrSet.add(def.partitionKey);
      const gsis = def.gsis?.map((gsi) => {
        attrSet.add(gsi.partitionKey);
        if (gsi.sortKey) attrSet.add(gsi.sortKey);
        return {
          IndexName: gsi.indexName,
          KeySchema: [
            { AttributeName: gsi.partitionKey, KeyType: "HASH" as const },
            ...(gsi.sortKey ? [{ AttributeName: gsi.sortKey, KeyType: "RANGE" as const }] : []),
          ],
          Projection: { ProjectionType: "ALL" as const },
        };
      });

      await client.send(
        new CreateTableCommand({
          TableName: def.tableName,
          AttributeDefinitions: [...attrSet].map((name) => ({
            AttributeName: name,
            AttributeType: "S",
          })),
          KeySchema: [
            { AttributeName: def.partitionKey, KeyType: "HASH" },
          ],
          BillingMode: "PAY_PER_REQUEST",
          ...(gsis && gsis.length > 0 ? { GlobalSecondaryIndexes: gsis } : {}),
        }),
      );
      console.log(`✓ ${def.tableName} 作成完了`);
    }
  }
}

async function put(tableName: string, item: Record<string, unknown>) {
  await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
}

async function seed() {
  const t = (name: string) => `${PREFIX}-${name}`;

  console.log("\n=== 大会情報 ===");
  await put(t("tournaments"), {
    id: TOURNAMENT_ID,
    name: "Kick Summit 2026",
    date: "2026-03-15",
    passwordHash: "admin",
    courtFee: 30000,
    partyFeePerPerson: 3000,
  });

  console.log("=== グループ ===");
  await put(t("groups"), { id: "group-a", tournamentId: TOURNAMENT_ID, name: "A" });
  await put(t("groups"), { id: "group-b", tournamentId: TOURNAMENT_ID, name: "B" });

  console.log("=== チーム ===");
  await put(t("teams"), { id: "t1", tournamentId: TOURNAMENT_ID, groupId: "group-a", name: "FC Thunder",    color: "#ef4444", partyCount: 5, receiptName: "" });
  await put(t("teams"), { id: "t2", tournamentId: TOURNAMENT_ID, groupId: "group-a", name: "Blue Sharks",   color: "#3b82f6", partyCount: 4, receiptName: "" });
  await put(t("teams"), { id: "t3", tournamentId: TOURNAMENT_ID, groupId: "group-a", name: "Green Vipers",  color: "#22c55e", partyCount: 6, receiptName: "" });
  await put(t("teams"), { id: "t4", tournamentId: TOURNAMENT_ID, groupId: "group-b", name: "Golden Eagles", color: "#eab308", partyCount: 5, receiptName: "" });
  await put(t("teams"), { id: "t5", tournamentId: TOURNAMENT_ID, groupId: "group-b", name: "Purple Storm",  color: "#a855f7", partyCount: 4, receiptName: "" });
  await put(t("teams"), { id: "t6", tournamentId: TOURNAMENT_ID, groupId: "group-b", name: "Red Phoenix",   color: "#f97316", partyCount: 3, receiptName: "" });

  console.log("=== 予選リーグ (グループA) ===");
  await put(t("matches"), { id: "m1", tournamentId: TOURNAMENT_ID, type: "league", groupId: "group-a", teamAId: "t1", teamBId: "t2", scoreA: 3, scoreB: 1, halfScoreA: 1, halfScoreB: 0, scheduledTime: "2026-03-15T10:00:00", court: "コート1", status: "finished" });
  await put(t("matches"), { id: "m2", tournamentId: TOURNAMENT_ID, type: "league", groupId: "group-a", teamAId: "t2", teamBId: "t3", scoreA: 2, scoreB: 2, halfScoreA: 1, halfScoreB: 1, scheduledTime: "2026-03-15T10:30:00", court: "コート2", status: "finished" });
  await put(t("matches"), { id: "m3", tournamentId: TOURNAMENT_ID, type: "league", groupId: "group-a", teamAId: "t1", teamBId: "t3", scoreA: null, scoreB: null, halfScoreA: null, halfScoreB: null, scheduledTime: "2026-03-15T11:00:00", court: "コート1", status: "scheduled" });

  console.log("=== 予選リーグ (グループB) ===");
  await put(t("matches"), { id: "m4", tournamentId: TOURNAMENT_ID, type: "league", groupId: "group-b", teamAId: "t4", teamBId: "t5", scoreA: 0, scoreB: 1, halfScoreA: 0, halfScoreB: 0, scheduledTime: "2026-03-15T10:00:00", court: "コート2", status: "finished" });
  await put(t("matches"), { id: "m5", tournamentId: TOURNAMENT_ID, type: "league", groupId: "group-b", teamAId: "t5", teamBId: "t6", scoreA: null, scoreB: null, halfScoreA: null, halfScoreB: null, scheduledTime: "2026-03-15T10:30:00", court: "コート1", status: "ongoing" });
  await put(t("matches"), { id: "m6", tournamentId: TOURNAMENT_ID, type: "league", groupId: "group-b", teamAId: "t4", teamBId: "t6", scoreA: null, scoreB: null, halfScoreA: null, halfScoreB: null, scheduledTime: "2026-03-15T11:00:00", court: "コート2", status: "scheduled" });

  console.log("=== 決勝トーナメント ===");
  // 準決勝
  await put(t("matches"), { id: "m7", tournamentId: TOURNAMENT_ID, type: "tournament", groupId: null, teamAId: null, teamBId: null, scoreA: null, scoreB: null, halfScoreA: null, halfScoreB: null, scheduledTime: "2026-03-15T12:00:00", court: "コート1", status: "scheduled" });
  await put(t("matches"), { id: "m8", tournamentId: TOURNAMENT_ID, type: "tournament", groupId: null, teamAId: null, teamBId: null, scoreA: null, scoreB: null, halfScoreA: null, halfScoreB: null, scheduledTime: "2026-03-15T12:00:00", court: "コート2", status: "scheduled" });
  // 決勝
  await put(t("matches"), { id: "m9", tournamentId: TOURNAMENT_ID, type: "tournament", groupId: null, teamAId: null, teamBId: null, scoreA: null, scoreB: null, halfScoreA: null, halfScoreB: null, scheduledTime: "2026-03-15T13:00:00", court: "コート1", status: "scheduled" });

  console.log("=== ブラケット ===");
  // 準決勝
  await put(t("brackets"), { id: "b1", tournamentId: TOURNAMENT_ID, round: 1, slot: 0, matchId: "m7", homeSeed: { groupId: "group-a", rank: 1 }, awaySeed: { groupId: "group-b", rank: 2 } });
  await put(t("brackets"), { id: "b2", tournamentId: TOURNAMENT_ID, round: 1, slot: 1, matchId: "m8", homeSeed: { groupId: "group-b", rank: 1 }, awaySeed: { groupId: "group-a", rank: 2 } });
  // 決勝
  await put(t("brackets"), { id: "b3", tournamentId: TOURNAMENT_ID, round: 2, slot: 0, matchId: "m9", homeSeed: null, awaySeed: null });

  console.log("\n✓ シード完了 (パスワード: admin)");
}

async function main() {
  await ensureTables();
  await seed();
}

main().catch(console.error);
