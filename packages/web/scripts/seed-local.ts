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
const EVENT_ID = "aws-kick-summit";

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
      { indexName: "custom-league-index", partitionKey: "customLeagueId" },
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
  {
    tableName: `${PREFIX}-custom-leagues`,
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

  // チームカスタムフィールドID（本番と同じ値）
  const CF_PARTY = "aFCWlj5dsEinV1z2IfRrC";
  const CF_REP = "wLqgH4kfCxk7SoOaqf2zU";

  // 大会カスタムフィールドID
  const EF_COURT = "ef-court-fee-001";
  const EF_SOCIAL = "ef-social-fee-001";

  const GROUP_A = "ly-riQnZJcN9ddtDUlQOt";
  const GROUP_B = "ZIrAX5E7vf4ZvT8Ej-xtJ";

  console.log("\n=== 大会情報 ===");
  await put(t("events"), {
    id: EVENT_ID,
    name: "Kick Summit 2026",
    date: "2026-03-15",
    passwordHash: "cm-katsuzo",
    description: `# AWS APNパートナー杯 開催のお知らせ\r\n\r\n春・秋恒例のAPN杯が今年も開催されます！\r\n今回の幹事はクラスメソッドが担当します。\r\n\r\n---\r\n\r\n## 📅 フットサル\r\n- **日時：** 4/18(土) 11:00〜15:00\r\n- **場所：** [フットサルクラブ東陽町コート](https://yoyaku.labola.jp/r/shop/2083/)\r\n\r\n## 🍻 懇親会\r\n- **日時：** 4/18(土) 16:00〜18:00\r\n- **場所：** [くいもの屋わん 東陽町駅前店](https://tabelog.com/tokyo/A1313/A131303/13150996/)\r\n- **会費：** 4,500円（飲み放題付き）\r\n\r\n---\r\n\r\n## 🏆 エンジョイフットサル特別ルール\r\n\r\n### 1. レディス・ダブル（女性ゴールは2点）\r\n- 女性プレーヤーのゴールは **1ゴール＝2点** とする\r\n- GKは女性のシュートには手を使えない\r\n- 手でセーブした場合、シュートを打った女性によるPKとする\r\n\r\n### 2. エスコート・システム（男性の連続得点制限）\r\n男性選手が得点した場合、次に女性選手が得点するまで、そのチームの男性のゴールは無効とする。\r\n1. 男性が得点\r\n2. 次は女性へのアシスト推奨\r\n3. 女性が得点\r\n4. 男性の得点が再び有効\r\n\r\n### 3. ジェントルマン・ディフェンス\r\n男性選手が女性ボール保持者に守備を行う場合、足を出して奪いにいく行為は禁止。\r\nパスコースへのカットなど、接触を伴わない守備のみ可とする。\r\n\r\n### 4. ノンコンタクト原則\r\n性別を問わず、過度なチャージや激しい接触プレーはファウルとする。\r\n「明日の仕事に響かないプレー」を心がけること。\r\n\r\n### 5. PKルール\r\nPK戦を行う場合、キッカーは女性選手のみとする。\r\n1巡してしまった場合は2巡目に続く。\r\n\r\n### 6. その他\r\nエンジョイの趣旨を損なうプレーは禁止。\r\n（例：逆転防止のための女性へのガチマーク、など）`,
    customFields: [
      { id: CF_PARTY, label: "懇親会参加人数", type: "number", required: true },
      { id: CF_REP, label: "代表者名", type: "text", required: true },
    ],
    eventFields: [
      { id: EF_COURT, label: "コート代", type: "number", required: false },
      { id: EF_SOCIAL, label: "懇親会費/人", type: "number", required: false },
    ],
    eventValues: {
      [EF_COURT]: 50000,
      [EF_SOCIAL]: 5000,
    },
  });

  console.log("=== コート ===");
  await put(t("courts"), { id: "h7ovYqKy_3DYMW_39P-Vt", eventId: EVENT_ID, name: "コートA" });
  await put(t("courts"), { id: "ML9Rz4vmhVkU1vVUlvq6v", eventId: EVENT_ID, name: "コートB" });

  console.log("=== グループ ===");
  await put(t("groups"), { id: GROUP_A, eventId: EVENT_ID, name: "グループA" });
  await put(t("groups"), { id: GROUP_B, eventId: EVENT_ID, name: "グループB" });

  console.log("=== チーム ===");
  // グループA（コートA）
  await put(t("teams"), { id: "WHqVUilIx0fHtM-b4QzA8",  eventId: EVENT_ID, groupId: GROUP_A, name: "クラスメソッド",          color: "#f7e73b", customValues: { [CF_REP]: "やまぐち", [CF_PARTY]: 7 } });
  await put(t("teams"), { id: "QoyOjEOrrlBlo3M4vhW5N",  eventId: EVENT_ID, groupId: GROUP_A, name: "AWS",                     color: "#f7a93b", customValues: { [CF_REP]: "山田",     [CF_PARTY]: 3 } });
  await put(t("teams"), { id: "ntt-data-team-001",       eventId: EVENT_ID, groupId: GROUP_A, name: "NTTデータ",               color: "#6366f1", customValues: { [CF_REP]: "伊藤",     [CF_PARTY]: 4 } });
  await put(t("teams"), { id: "Qu85OO3uv7apNvdN_-2fm",  eventId: EVENT_ID, groupId: GROUP_A, name: "アイレット",              color: "#3b82f6", customValues: { [CF_REP]: "鈴木",     [CF_PARTY]: 5 } });
  await put(t("teams"), { id: "WqecCmBeXF8zM3J0rjONL",  eventId: EVENT_ID, groupId: GROUP_A, name: "サーバーワークス",         color: "#f73b3b", customValues: { [CF_REP]: "中村",     [CF_PARTY]: 6 } });
  await put(t("teams"), { id: "4qNCC4sHN21mp8HgdGBN-",  eventId: EVENT_ID, groupId: GROUP_A, name: "ソニービズネットワークス",  color: "#3bf748", customValues: { [CF_REP]: "渡辺",     [CF_PARTY]: 5 } });
  // グループB（コートB）
  await put(t("teams"), { id: "2-oz27sexEU2eaJnXCysu",  eventId: EVENT_ID, groupId: GROUP_B, name: "ウイングアーク1st",        color: "#3be1f7", customValues: { [CF_REP]: "田中",     [CF_PARTY]: 4 } });
  await put(t("teams"), { id: "P0qlPKU1bcOq0ZBOPXJ8B",  eventId: EVENT_ID, groupId: GROUP_B, name: "スカイアーチ",             color: "#90f73b", customValues: { [CF_REP]: "佐藤",     [CF_PARTY]: 6 } });
  await put(t("teams"), { id: "irh0VNKbjFeakqme7c_rB",  eventId: EVENT_ID, groupId: GROUP_B, name: "Zscaler",                 color: "#f73ba9", customValues: { [CF_REP]: "小林",     [CF_PARTY]: 4 } });
  await put(t("teams"), { id: "GKC7DDi-DxI0nzvYovWoF",  eventId: EVENT_ID, groupId: GROUP_B, name: "ISV連合 with ProServ",    color: "#01c7fc", customValues: { [CF_REP]: "まつお",   [CF_PARTY]: 5 } });
  await put(t("teams"), { id: "SlhMuk-PeUTiRF1aWwORj",  eventId: EVENT_ID, groupId: GROUP_B, name: "アンチ＆ギーク",           color: "#c5f73b", customValues: { [CF_REP]: "加藤",     [CF_PARTY]: 8 } });
  await put(t("teams"), { id: "open-joint-team-001",     eventId: EVENT_ID, groupId: GROUP_B, name: "有志合同チーム",           color: "#a8a29e", customValues: { [CF_REP]: "吉田",     [CF_PARTY]: 5 } });

  // ===== チームID変数 =====
  // グループA（コートA）
  const CM   = "WHqVUilIx0fHtM-b4QzA8"; // クラスメソッド
  const AWS_ = "QoyOjEOrrlBlo3M4vhW5N"; // AWS
  const NTT  = "ntt-data-team-001";      // NTTデータ
  const IRET = "Qu85OO3uv7apNvdN_-2fm";  // アイレット
  const SWX  = "WqecCmBeXF8zM3J0rjONL";  // サーバーワークス
  const SONY = "4qNCC4sHN21mp8HgdGBN-";  // ソニービズネットワークス
  // グループB（コートB）
  const WING = "2-oz27sexEU2eaJnXCysu";  // ウイングアーク1st
  const SKY  = "P0qlPKU1bcOq0ZBOPXJ8B";  // スカイアーチ
  const ZSC  = "irh0VNKbjFeakqme7c_rB";  // Zscaler
  const ISV  = "GKC7DDi-DxI0nzvYovWoF";  // ISV連合 with ProServ
  const ANTI = "SlhMuk-PeUTiRF1aWwORj";  // アンチ＆ギーク
  const OPEN = "open-joint-team-001";     // 有志合同チーム

  const D = "2026-04-18";

  // 予選試合 (type=league)
  console.log("\n=== 予選試合 ===");
  type LeagueMatchDef = {
    time: string;
    aHome: string; aAway: string; aRef1: string;
    bHome: string; bAway: string; bRef1: string;
    label: string;
  };
  const leagueMatchDefs: LeagueMatchDef[] = [
    { time: "11:15", aHome: CM,   aAway: AWS_, aRef1: NTT,  bHome: WING, bAway: SKY,  bRef1: ZSC,  label: "予選1" },
    { time: "11:25", aHome: NTT,  aAway: IRET, aRef1: SWX,  bHome: ZSC,  bAway: ISV,  bRef1: ANTI, label: "予選2" },
    { time: "11:35", aHome: SWX,  aAway: SONY, aRef1: CM,   bHome: ANTI, bAway: OPEN, bRef1: WING, label: "予選3" },
    { time: "11:45", aHome: CM,   aAway: NTT,  aRef1: IRET, bHome: WING, bAway: ZSC,  bRef1: ISV,  label: "予選4" },
    { time: "11:55", aHome: AWS_, aAway: SWX,  aRef1: SONY, bHome: SKY,  bAway: OPEN, bRef1: WING, label: "予選5" },
    { time: "12:05", aHome: IRET, aAway: SONY, aRef1: AWS_, bHome: ISV,  bAway: OPEN, bRef1: SKY,  label: "予選6" },
    { time: "12:15", aHome: CM,   aAway: SWX,  aRef1: NTT,  bHome: WING, bAway: ISV,  bRef1: ZSC,  label: "予選7" },
    { time: "12:25", aHome: AWS_, aAway: IRET, aRef1: CM,   bHome: SKY,  bAway: ANTI, bRef1: WING, label: "予選8" },
    { time: "12:35", aHome: NTT,  aAway: SONY, aRef1: IRET, bHome: ZSC,  bAway: OPEN, bRef1: WING, label: "予選9" },
    { time: "12:45", aHome: CM,   aAway: IRET, aRef1: SWX,  bHome: WING, bAway: ANTI, bRef1: SKY,  label: "予選10" },
    { time: "12:55", aHome: AWS_, aAway: SONY, aRef1: CM,   bHome: SKY,  bAway: ZSC,  bRef1: WING, label: "予選11" },
    { time: "13:05", aHome: NTT,  aAway: SWX,  aRef1: AWS_, bHome: ISV,  bAway: ANTI, bRef1: ZSC,  label: "予選12" },
    { time: "13:15", aHome: CM,   aAway: SONY, aRef1: IRET, bHome: WING, bAway: OPEN, bRef1: SKY,  label: "予選13" },
    { time: "13:25", aHome: AWS_, aAway: NTT,  aRef1: SONY, bHome: SKY,  bAway: ISV,  bRef1: ZSC,  label: "予選14" },
    { time: "13:35", aHome: IRET, aAway: SWX,  aRef1: NTT,  bHome: ZSC,  bAway: ANTI, bRef1: WING, label: "予選15" },
  ];

  for (const m of leagueMatchDefs) {
    await put(t("matches"), {
      id: nanoid(), eventId: EVENT_ID, type: "league", groupId: GROUP_A,
      teamAId: m.aHome, teamBId: m.aAway,
      scoreA: null, scoreB: null, halfScoreA: null, halfScoreB: null,
      scheduledTime: `${D}T${m.time}:00`,
      durationMinutes: 7, court: "コートA", status: "scheduled",
      refereeTeamId: m.aRef1, customLeagueId: null, teamARefLabel: null, teamBRefLabel: null,
    });
    await put(t("matches"), {
      id: nanoid(), eventId: EVENT_ID, type: "league", groupId: GROUP_B,
      teamAId: m.bHome, teamBId: m.bAway,
      scoreA: null, scoreB: null, halfScoreA: null, halfScoreB: null,
      scheduledTime: `${D}T${m.time}:00`,
      durationMinutes: 7, court: "コートB", status: "scheduled",
      refereeTeamId: m.bRef1, customLeagueId: null, teamARefLabel: null, teamBRefLabel: null,
    });
    console.log(`  ${m.label}`);
  }

  // ===== カスタムリーグ: 順位決定戦 =====
  console.log("\n=== カスタムリーグ: 順位決定戦 ===");
  const CL_ID = "ranking-matches-2026";
  await put(t("custom-leagues"), { id: CL_ID, eventId: EVENT_ID, name: "順位決定戦" });

  const GRP_RANK = (groupId: string, rank: number) => `group-rank:${groupId}:${rank}`;
  type RankMatchDef = { time: string; court: string; aGrp: string; aRank: number; bGrp: string; bRank: number; label: string };
  const rankMatchDefs: RankMatchDef[] = [
    { time: "13:50", court: "コートA", aGrp: GROUP_A, aRank: 6, bGrp: GROUP_B, bRank: 6, label: "11位決定戦" },
    { time: "13:50", court: "コートB", aGrp: GROUP_A, aRank: 5, bGrp: GROUP_B, bRank: 5, label: "9位決定戦" },
    { time: "14:00", court: "コートA", aGrp: GROUP_A, aRank: 4, bGrp: GROUP_B, bRank: 4, label: "7位決定戦" },
    { time: "14:00", court: "コートB", aGrp: GROUP_A, aRank: 3, bGrp: GROUP_B, bRank: 3, label: "5位決定戦" },
    { time: "14:10", court: "コートA", aGrp: GROUP_A, aRank: 1, bGrp: GROUP_B, bRank: 1, label: "決勝戦" },
    { time: "14:10", court: "コートB", aGrp: GROUP_A, aRank: 2, bGrp: GROUP_B, bRank: 2, label: "3位決定戦" },
  ];

  for (const m of rankMatchDefs) {
    await put(t("matches"), {
      id: nanoid(), eventId: EVENT_ID, type: "custom-league",
      groupId: null, customLeagueId: CL_ID,
      teamAId: null, teamBId: null,
      teamARefLabel: GRP_RANK(m.aGrp, m.aRank),
      teamBRefLabel: GRP_RANK(m.bGrp, m.bRank),
      scoreA: null, scoreB: null, halfScoreA: null, halfScoreB: null,
      scheduledTime: `${D}T${m.time}:00`,
      durationMinutes: 7, court: m.court, status: "scheduled",
      refereeTeamId: null,
    });
    console.log(`  ${m.label}: グループA${m.aRank}位 vs グループB${m.bRank}位`);
  }

  console.log("\n✓ シード完了");
}

async function main() {
  await ensureTables();
  await seed();
}

main().catch(console.error);
