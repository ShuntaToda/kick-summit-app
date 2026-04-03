import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";

const client = new DynamoDBClient({
  region: "ap-northeast-1",
  endpoint: "http://localhost:8000",
  credentials: { accessKeyId: "dummy", secretAccessKey: "dummy" },
});
const docClient = DynamoDBDocumentClient.from(client);

const PREFIX = "kick-summit";
const EVENT_ID = "default";

interface TableDef {
  tableName: string;
  partitionKey: string;
  gsis?: { indexName: string; partitionKey: string; sortKey?: string }[];
}

const TABLES: TableDef[] = [
  {
    tableName: `${PREFIX}-events`,
    partitionKey: "id",
  },
  {
    tableName: `${PREFIX}-groups`,
    partitionKey: "id",
    gsis: [
      { indexName: "eventId-index", partitionKey: "eventId" },
    ],
  },
  {
    tableName: `${PREFIX}-teams`,
    partitionKey: "id",
    gsis: [
      { indexName: "eventId-index", partitionKey: "eventId" },
      { indexName: "groupId-index", partitionKey: "groupId" },
    ],
  },
  {
    tableName: `${PREFIX}-matches`,
    partitionKey: "id",
    gsis: [
      { indexName: "schedule-index", partitionKey: "eventId", sortKey: "scheduledTime" },
      { indexName: "group-index", partitionKey: "groupId" },
    ],
  },
  {
    tableName: `${PREFIX}-brackets`,
    partitionKey: "id",
    gsis: [
      { indexName: "eventId-index", partitionKey: "eventId" },
    ],
  },
  {
    tableName: `${PREFIX}-courts`,
    partitionKey: "id",
    gsis: [
      { indexName: "eventId-index", partitionKey: "eventId" },
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

function removeNulls(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null),
  );
}

async function put(tableName: string, item: Record<string, unknown>) {
  await docClient.send(new PutCommand({ TableName: tableName, Item: removeNulls(item) }));
}

async function seed() {
  const t = (name: string) => `${PREFIX}-${name}`;

  // ID を事前生成して参照整合性を保つ
  const gA = nanoid(); const gB = nanoid();
  const t1 = nanoid(); const t2 = nanoid(); const t3 = nanoid();
  const t4 = nanoid(); const t5 = nanoid(); const t6 = nanoid();
  const m1 = nanoid(); const m2 = nanoid(); const m3 = nanoid();
  const m4 = nanoid(); const m5 = nanoid(); const m6 = nanoid();
  const m7 = nanoid(); const m8 = nanoid(); const m9 = nanoid();
  const b1 = nanoid(); const b2 = nanoid(); const b3 = nanoid();

  console.log("\n=== 大会情報 ===");
  const cfParty = nanoid();
  const cfRep = nanoid();
  await put(t("events"), {
    id: EVENT_ID,
    name: "Kick Summit 2026",
    date: "2026-03-15",
    passwordHash: "admin",
    description: [
      "## Kick Summit 2026 開催要項",
      "",
      "社内フットサル大会 **Kick Summit 2026** を開催します！",
      "",
      "### 大会概要",
      "- **日時**: 2026年3月15日（日） 10:00〜15:00",
      "- **会場**: スポーツプラザ東京 フットサルコート",
      "- **参加チーム数**: 6チーム",
      "- **試合形式**: 5人制フットサル（交代自由）",
      "",
      "### ルール",
      "- 予選リーグ（2グループ × 3チーム）→ 決勝トーナメント",
      "- 予選は1試合 **10分ハーフなし**",
      "- 決勝トーナメントは1試合 **10分ハーフなし**、同点の場合はPK戦",
      "- 勝ち点: 勝利3点 / 引き分け1点 / 敗北0点",
      "",
      "### 持ち物",
      "- 運動できる服装（チームでユニフォームの色を揃えてください）",
      "- 室内シューズ（レンタルあり）",
      "- タオル・飲み物",
      "",
      "### 懇親会",
      "試合終了後に会場近くの居酒屋で懇親会を予定しています。参加希望の方はチーム設定から人数を登録してください。",
      "",
      "### お問い合わせ",
      "運営チーム: kick-summit@example.com",
    ].join("\n"),
    customFields: [
      { id: cfParty, label: "懇親会参加人数", type: "number", required: false },
      { id: cfRep, label: "懇親会代表者名", type: "text", required: false },
    ],
  });

  console.log("=== コート ===");
  const c1 = nanoid(); const c2 = nanoid();
  await put(t("courts"), { id: c1, eventId: EVENT_ID, name: "コート1" });
  await put(t("courts"), { id: c2, eventId: EVENT_ID, name: "コート2" });

  console.log("=== グループ ===");
  await put(t("groups"), { id: gA, eventId: EVENT_ID, name: "A" });
  await put(t("groups"), { id: gB, eventId: EVENT_ID, name: "B" });

  console.log("=== チーム ===");
  await put(t("teams"), { id: t1, eventId: EVENT_ID, groupId: gA, name: "FC Thunder",    color: "#ef4444", customValues: { [cfParty]: 5, [cfRep]: "田中太郎" } });
  await put(t("teams"), { id: t2, eventId: EVENT_ID, groupId: gA, name: "Blue Sharks",   color: "#3b82f6", customValues: { [cfParty]: 4, [cfRep]: "佐藤花子" } });
  await put(t("teams"), { id: t3, eventId: EVENT_ID, groupId: gA, name: "Green Vipers",  color: "#22c55e", customValues: { [cfParty]: 6, [cfRep]: "鈴木一郎" } });
  await put(t("teams"), { id: t4, eventId: EVENT_ID, groupId: gB, name: "Golden Eagles", color: "#eab308", customValues: { [cfParty]: 5, [cfRep]: "山田次郎" } });
  await put(t("teams"), { id: t5, eventId: EVENT_ID, groupId: gB, name: "Purple Storm",  color: "#a855f7", customValues: { [cfParty]: 4, [cfRep]: "高橋美咲" } });
  await put(t("teams"), { id: t6, eventId: EVENT_ID, groupId: gB, name: "Red Phoenix",   color: "#f97316", customValues: { [cfParty]: 3, [cfRep]: "伊藤健太" } });

  console.log("=== 予選リーグ (グループA) ===");
  await put(t("matches"), { id: m1, eventId: EVENT_ID, type: "league", groupId: gA, teamAId: t1, teamBId: t2, scoreA: 3, scoreB: 1, halfScoreA: 1, halfScoreB: 0, scheduledTime: "2026-03-15T10:00:00", durationMinutes: 10, court: "コート1", status: "finished" });
  await put(t("matches"), { id: m2, eventId: EVENT_ID, type: "league", groupId: gA, teamAId: t2, teamBId: t3, scoreA: 2, scoreB: 2, halfScoreA: 1, halfScoreB: 1, scheduledTime: "2026-03-15T10:30:00", durationMinutes: 10, court: "コート2", status: "finished" });
  await put(t("matches"), { id: m3, eventId: EVENT_ID, type: "league", groupId: gA, teamAId: t1, teamBId: t3, scheduledTime: "2026-03-15T11:00:00", durationMinutes: 10, court: "コート1", status: "scheduled" });

  console.log("=== 予選リーグ (グループB) ===");
  await put(t("matches"), { id: m4, eventId: EVENT_ID, type: "league", groupId: gB, teamAId: t4, teamBId: t5, scoreA: 0, scoreB: 1, halfScoreA: 0, halfScoreB: 0, scheduledTime: "2026-03-15T10:00:00", durationMinutes: 10, court: "コート2", status: "finished" });
  await put(t("matches"), { id: m5, eventId: EVENT_ID, type: "league", groupId: gB, teamAId: t5, teamBId: t6, scheduledTime: "2026-03-15T10:30:00", durationMinutes: 10, court: "コート1", status: "ongoing" });
  await put(t("matches"), { id: m6, eventId: EVENT_ID, type: "league", groupId: gB, teamAId: t4, teamBId: t6, scheduledTime: "2026-03-15T11:00:00", durationMinutes: 10, court: "コート2", status: "scheduled" });

  console.log("=== 決勝トーナメント ===");
  await put(t("matches"), { id: m7, eventId: EVENT_ID, type: "tournament", scheduledTime: "2026-03-15T12:00:00", durationMinutes: 10, court: "コート1", status: "scheduled" });
  await put(t("matches"), { id: m8, eventId: EVENT_ID, type: "tournament", scheduledTime: "2026-03-15T12:00:00", durationMinutes: 10, court: "コート2", status: "scheduled" });
  await put(t("matches"), { id: m9, eventId: EVENT_ID, type: "tournament", scheduledTime: "2026-03-15T13:00:00", durationMinutes: 10, court: "コート1", status: "scheduled" });

  console.log("=== ブラケット ===");
  await put(t("brackets"), { id: b1, eventId: EVENT_ID, bracketName: "決勝トーナメント", round: 1, slot: 0, matchId: m7, matchLabel: "1回戦第1試合", homeRef: { type: "team", teamId: t1 }, awayRef: { type: "team", teamId: t5 } });
  await put(t("brackets"), { id: b2, eventId: EVENT_ID, bracketName: "決勝トーナメント", round: 1, slot: 1, matchId: m8, matchLabel: "1回戦第2試合", homeRef: { type: "team", teamId: t4 }, awayRef: { type: "team", teamId: t2 } });
  await put(t("brackets"), { id: b3, eventId: EVENT_ID, bracketName: "決勝トーナメント", round: 2, slot: 0, matchId: m9, matchLabel: "決勝", homeRef: { type: "match-result", matchId: m7, result: "winner" }, awayRef: { type: "match-result", matchId: m8, result: "winner" } });

  console.log("\n✓ シード完了 (パスワード: admin)");
}

async function main() {
  await ensureTables();
  await seed();
}

main().catch(console.error);
