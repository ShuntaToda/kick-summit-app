import { DynamoDBClient, CreateTableCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";

const isLocal = process.argv.includes("--local");

const client = new DynamoDBClient({
  region: "ap-northeast-1",
  ...(isLocal && {
    endpoint: "http://localhost:8000",
    credentials: { accessKeyId: "dummy", secretAccessKey: "dummy" },
  }),
});
const docClient = DynamoDBDocumentClient.from(client);

const stage = process.env.STAGE ?? "prod";
const PREFIX = stage === "prod" ? "kick-summit" : `kick-summit-${stage}`;
const TABLES = {
  events: `${PREFIX}-events`,
  groups: `${PREFIX}-groups`,
  teams: `${PREFIX}-teams`,
  matches: `${PREFIX}-matches`,
  brackets: `${PREFIX}-brackets`,
  courts: `${PREFIX}-courts`,
  customLeagues: `${PREFIX}-custom-leagues`,
};

const EVENT_ID = "aws-kick-summit";

console.log(`ターゲット: ${isLocal ? "ローカル (localhost:8000)" : `AWS リモート (${PREFIX})`}\n`);

async function recreateTableLocal(name: string, keySchema: { hash: string; range?: string }, gsiList?: { name: string; hash: string; range?: string }[]) {
  try { await client.send(new DeleteTableCommand({ TableName: name })); } catch { /* 存在しない */ }
  const attrs = new Map<string, string>();
  attrs.set(keySchema.hash, "S");
  if (keySchema.range) attrs.set(keySchema.range, "S");
  for (const gsi of gsiList ?? []) {
    attrs.set(gsi.hash, "S");
    if (gsi.range) attrs.set(gsi.range, "S");
  }
  await client.send(new CreateTableCommand({
    TableName: name,
    AttributeDefinitions: [...attrs.entries()].map(([n, t]) => ({ AttributeName: n, AttributeType: t })),
    KeySchema: [
      { AttributeName: keySchema.hash, KeyType: "HASH" },
      ...(keySchema.range ? [{ AttributeName: keySchema.range, KeyType: "RANGE" as const }] : []),
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
  }));
  console.log(`  ${name}: 再作成完了`);
}

function removeNulls(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null));
}

async function put(table: string, item: Record<string, unknown>) {
  await docClient.send(new PutCommand({ TableName: table, Item: removeNulls(item) }));
}

async function deleteAllItems(table: string) {
  let lastKey: Record<string, unknown> | undefined;
  let total = 0;
  do {
    const result = await docClient.send(new ScanCommand({
      TableName: table,
      ProjectionExpression: "id",
      ...(lastKey && { ExclusiveStartKey: lastKey }),
    }));
    const items = result.Items ?? [];
    for (const item of items) {
      await docClient.send(new DeleteCommand({ TableName: table, Key: { id: item.id } }));
    }
    total += items.length;
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);
  if (total > 0) console.log(`  ${table}: ${total}件 削除`);
}

async function seed() {
  if (isLocal) {
    console.log("=== テーブル再作成 (ローカル) ===");
    await recreateTableLocal(TABLES.events, { hash: "id" });
    await recreateTableLocal(TABLES.groups, { hash: "id" }, [{ name: "eventId-index", hash: "eventId" }]);
    await recreateTableLocal(TABLES.teams, { hash: "id" }, [{ name: "eventId-index", hash: "eventId" }, { name: "groupId-index", hash: "groupId" }]);
    await recreateTableLocal(TABLES.matches, { hash: "id" }, [{ name: "schedule-index", hash: "eventId", range: "scheduledTime" }, { name: "group-index", hash: "groupId" }, { name: "custom-league-index", hash: "customLeagueId" }]);
    await recreateTableLocal(TABLES.brackets, { hash: "id" }, [{ name: "eventId-index", hash: "eventId" }]);
    await recreateTableLocal(TABLES.courts, { hash: "id" }, [{ name: "eventId-index", hash: "eventId" }]);
    await recreateTableLocal(TABLES.customLeagues, { hash: "id" }, [{ name: "eventId-index", hash: "eventId" }]);
  } else {
    console.log("=== 既存データ削除 (リモート) ===");
    for (const table of Object.values(TABLES)) {
      await deleteAllItems(table);
    }
  }

  // チームカスタムフィールドID（本番と同じ値）
  const CF_PARTY = "aFCWlj5dsEinV1z2IfRrC";
  const CF_REP = "wLqgH4kfCxk7SoOaqf2zU";

  // 大会カスタムフィールドID
  const EF_COURT = "ef-court-fee-001";
  const EF_SOCIAL = "ef-social-fee-001";

  console.log("\n=== 大会情報 ===");
  await put(TABLES.events, {
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
  await put(TABLES.courts, { id: "h7ovYqKy_3DYMW_39P-Vt", eventId: EVENT_ID, name: "コートA" });
  await put(TABLES.courts, { id: "ML9Rz4vmhVkU1vVUlvq6v", eventId: EVENT_ID, name: "コートB" });

  console.log("=== グループ ===");
  const GROUP_A = "ly-riQnZJcN9ddtDUlQOt";
  const GROUP_B = "ZIrAX5E7vf4ZvT8Ej-xtJ";
  await put(TABLES.groups, { id: GROUP_A, eventId: EVENT_ID, name: "グループA" });
  await put(TABLES.groups, { id: GROUP_B, eventId: EVENT_ID, name: "グループB" });

  console.log("=== チーム ===");
  const teams = [
    // グループA（コートA）
    { id: "WHqVUilIx0fHtM-b4QzA8",  name: "クラスメソッド",         groupId: GROUP_A, color: "#f7e73b", customValues: isLocal ? { [CF_REP]: "やまぐち", [CF_PARTY]: 7 } : { [CF_REP]: "", [CF_PARTY]: 0 } },
    { id: "QoyOjEOrrlBlo3M4vhW5N",  name: "AWS",                    groupId: GROUP_A, color: "#f7a93b", customValues: isLocal ? { [CF_REP]: "山田",     [CF_PARTY]: 3 } : { [CF_REP]: "", [CF_PARTY]: 0 } },
    { id: "ntt-data-team-001",       name: "NTTデータ",              groupId: GROUP_A, color: "#6366f1", customValues: isLocal ? { [CF_REP]: "伊藤",     [CF_PARTY]: 4 } : { [CF_REP]: "", [CF_PARTY]: 0 } },
    { id: "Qu85OO3uv7apNvdN_-2fm",  name: "アイレット",             groupId: GROUP_A, color: "#3b82f6", customValues: isLocal ? { [CF_REP]: "鈴木",     [CF_PARTY]: 5 } : { [CF_REP]: "", [CF_PARTY]: 0 } },
    { id: "WqecCmBeXF8zM3J0rjONL",  name: "サーバーワークス",        groupId: GROUP_A, color: "#f73b3b", customValues: isLocal ? { [CF_REP]: "中村",     [CF_PARTY]: 6 } : { [CF_REP]: "", [CF_PARTY]: 0 } },
    { id: "4qNCC4sHN21mp8HgdGBN-",  name: "ソニービズネットワークス", groupId: GROUP_A, color: "#3bf748", customValues: isLocal ? { [CF_REP]: "渡辺",     [CF_PARTY]: 5 } : { [CF_REP]: "", [CF_PARTY]: 0 } },
    // グループB（コートB）
    { id: "2-oz27sexEU2eaJnXCysu",  name: "ウイングアーク1st",       groupId: GROUP_B, color: "#3be1f7", customValues: isLocal ? { [CF_REP]: "田中",     [CF_PARTY]: 4 } : { [CF_REP]: "", [CF_PARTY]: 0 } },
    { id: "P0qlPKU1bcOq0ZBOPXJ8B",  name: "スカイアーチ",            groupId: GROUP_B, color: "#90f73b", customValues: isLocal ? { [CF_REP]: "佐藤",     [CF_PARTY]: 6 } : { [CF_REP]: "", [CF_PARTY]: 0 } },
    { id: "irh0VNKbjFeakqme7c_rB",  name: "Zscaler",                groupId: GROUP_B, color: "#f73ba9", customValues: isLocal ? { [CF_REP]: "小林",     [CF_PARTY]: 4 } : { [CF_REP]: "", [CF_PARTY]: 0 } },
    { id: "GKC7DDi-DxI0nzvYovWoF",  name: "ISV連合 with ProServ",   groupId: GROUP_B, color: "#01c7fc", customValues: isLocal ? { [CF_REP]: "まつお",   [CF_PARTY]: 5 } : { [CF_REP]: "", [CF_PARTY]: 0 } },
    { id: "SlhMuk-PeUTiRF1aWwORj",  name: "アンチ＆ギーク",          groupId: GROUP_B, color: "#c5f73b", customValues: isLocal ? { [CF_REP]: "加藤",     [CF_PARTY]: 8 } : { [CF_REP]: "", [CF_PARTY]: 0 } },
    { id: "open-joint-team-001",     name: "有志合同チーム",          groupId: GROUP_B, color: "#a8a29e", customValues: isLocal ? { [CF_REP]: "吉田",     [CF_PARTY]: 5 } : { [CF_REP]: "", [CF_PARTY]: 0 } },
  ];
  for (const t of teams) {
    await put(TABLES.teams, { ...t, eventId: EVENT_ID });
    console.log(`  ${t.name} (${t.groupId === GROUP_A ? "グループA" : "グループB"})`);
  }

  // ===== チームID変数 =====
  // グループA（コートA）
  const CM   = "WHqVUilIx0fHtM-b4QzA8"; // クラスメソッド
  const AWS  = "QoyOjEOrrlBlo3M4vhW5N"; // AWS
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
  // 各行: [time, courtA_home, courtA_away, courtA_ref1, courtA_ref2, courtB_home, courtB_away, courtB_ref1, courtB_ref2]
  console.log("\n=== 予選試合 ===");
  type LeagueMatchDef = {
    time: string;
    aHome: string; aAway: string; aRef1: string; aRef2: string;
    bHome: string; bAway: string; bRef1: string; bRef2: string;
    label: string;
  };
  // コートA = グループA（CM,AWS,NTT,IRET,SWX,SONY）
  // コートB = グループB（WING,SKY,ZSC,ISV,ANTI,OPEN）
  // aRef1/aRef2: コートA審判, bRef1/bRef2: コートB審判
  const leagueMatchDefs: LeagueMatchDef[] = [
    { time: "11:15", aHome: CM,   aAway: AWS,  aRef1: NTT,  aRef2: IRET, bHome: WING, bAway: SKY,  bRef1: ZSC,  bRef2: ISV,  label: "予選1" },
    { time: "11:25", aHome: NTT,  aAway: IRET, aRef1: SWX,  aRef2: SONY, bHome: ZSC,  bAway: ISV,  bRef1: ANTI, bRef2: OPEN, label: "予選2" },
    { time: "11:35", aHome: SWX,  aAway: SONY, aRef1: CM,   aRef2: AWS,  bHome: ANTI, bAway: OPEN, bRef1: WING, bRef2: SKY,  label: "予選3" },
    { time: "11:45", aHome: CM,   aAway: NTT,  aRef1: IRET, aRef2: SWX,  bHome: WING, bAway: ZSC,  bRef1: ISV,  bRef2: ANTI, label: "予選4" },
    { time: "11:55", aHome: AWS,  aAway: SWX,  aRef1: SONY, aRef2: CM,   bHome: SKY,  bAway: OPEN, bRef1: WING, bRef2: ZSC,  label: "予選5" },
    { time: "12:05", aHome: IRET, aAway: SONY, aRef1: AWS,  aRef2: NTT,  bHome: ISV,  bAway: OPEN, bRef1: SKY,  bRef2: ANTI, label: "予選6" },
    { time: "12:15", aHome: CM,   aAway: SWX,  aRef1: NTT,  aRef2: SONY, bHome: WING, bAway: ISV,  bRef1: ZSC,  bRef2: OPEN, label: "予選7" },
    { time: "12:25", aHome: AWS,  aAway: IRET, aRef1: CM,   aRef2: SWX,  bHome: SKY,  bAway: ANTI, bRef1: WING, bRef2: ISV,  label: "予選8" },
    { time: "12:35", aHome: NTT,  aAway: SONY, aRef1: IRET, aRef2: AWS,  bHome: ZSC,  bAway: OPEN, bRef1: WING, bRef2: ANTI, label: "予選9" },
    { time: "12:45", aHome: CM,   aAway: IRET, aRef1: SWX,  aRef2: NTT,  bHome: WING, bAway: ANTI, bRef1: SKY,  bRef2: ISV,  label: "予選10" },
    { time: "12:55", aHome: AWS,  aAway: SONY, aRef1: CM,   aRef2: IRET, bHome: SKY,  bAway: ZSC,  bRef1: WING, bRef2: OPEN, label: "予選11" },
    { time: "13:05", aHome: NTT,  aAway: SWX,  aRef1: AWS,  aRef2: SONY, bHome: ISV,  bAway: ANTI, bRef1: ZSC,  bRef2: OPEN, label: "予選12" },
    { time: "13:15", aHome: CM,   aAway: SONY, aRef1: IRET, aRef2: SWX,  bHome: WING, bAway: OPEN, bRef1: SKY,  bRef2: ISV,  label: "予選13" },
    { time: "13:25", aHome: AWS,  aAway: NTT,  aRef1: SONY, aRef2: CM,   bHome: SKY,  bAway: ISV,  bRef1: ZSC,  bRef2: ANTI, label: "予選14" },
    { time: "13:35", aHome: IRET, aAway: SWX,  aRef1: NTT,  aRef2: AWS,  bHome: ZSC,  bAway: ANTI, bRef1: WING, bRef2: OPEN, label: "予選15" },
  ];
  // ※ 上記はスケジュール表と同一内容で確認済み

  for (const m of leagueMatchDefs) {
    const idA = nanoid();
    const idB = nanoid();
    await put(TABLES.matches, {
      id: idA, eventId: EVENT_ID, type: "league", groupId: GROUP_A,
      teamAId: m.aHome, teamBId: m.aAway,
      scoreA: null, scoreB: null, halfScoreA: null, halfScoreB: null,
      scheduledTime: `${D}T${m.time}:00`,
      durationMinutes: 7, court: "コートA", status: "scheduled",
      refereeTeamId: m.aRef1, refereeTeamId2: m.aRef2, customLeagueId: null, teamARefLabel: null, teamBRefLabel: null,
    });
    await put(TABLES.matches, {
      id: idB, eventId: EVENT_ID, type: "league", groupId: GROUP_B,
      teamAId: m.bHome, teamBId: m.bAway,
      scoreA: null, scoreB: null, halfScoreA: null, halfScoreB: null,
      scheduledTime: `${D}T${m.time}:00`,
      durationMinutes: 7, court: "コートB", status: "scheduled",
      refereeTeamId: m.bRef1, refereeTeamId2: m.bRef2, customLeagueId: null, teamARefLabel: null, teamBRefLabel: null,
    });
    console.log(`  ${m.label}: コートA (${m.aHome.slice(0, 8)}...) / コートB (${m.bHome.slice(0, 8)}...)`);
  }

  // ===== カスタムリーグ: 順位決定戦 =====
  console.log("\n=== カスタムリーグ: 順位決定戦 ===");
  const CL_ID = "ranking-matches-2026";
  await put(TABLES.customLeagues, { id: CL_ID, eventId: EVENT_ID, name: "順位決定戦" });

  const GRP_RANK = (groupId: string, rank: number) => `group-rank:${groupId}:${rank}`;
  // スケジュール表通りの審判 (group-rank 参照)
  // 11位決定戦: A4位/B4位, 9位決定戦: A3位/B3位
  // 7位決定戦: A1位/B1位, 5位決定戦: A5位/B5位
  // 決勝戦: A6位/B6位, 3位決定戦: A5位/B5位
  type RankMatchDef = {
    time: string; court: string;
    aRank: number; bRank: number;
    ref1Rank: number; ref1Group: string;
    ref2Rank: number; ref2Group: string;
    label: string;
  };
  const rankMatchDefs: RankMatchDef[] = [
    { time: "13:50", court: "コートA", aRank: 6, bRank: 6, ref1Rank: 4, ref1Group: GROUP_A, ref2Rank: 4, ref2Group: GROUP_B, label: "11位決定戦" },
    { time: "13:50", court: "コートB", aRank: 5, bRank: 5, ref1Rank: 3, ref1Group: GROUP_A, ref2Rank: 3, ref2Group: GROUP_B, label: "9位決定戦" },
    { time: "14:00", court: "コートA", aRank: 4, bRank: 4, ref1Rank: 1, ref1Group: GROUP_A, ref2Rank: 1, ref2Group: GROUP_B, label: "7位決定戦" },
    { time: "14:00", court: "コートB", aRank: 3, bRank: 3, ref1Rank: 5, ref1Group: GROUP_A, ref2Rank: 5, ref2Group: GROUP_B, label: "5位決定戦" },
    { time: "14:10", court: "コートA", aRank: 1, bRank: 1, ref1Rank: 6, ref1Group: GROUP_A, ref2Rank: 6, ref2Group: GROUP_B, label: "決勝戦" },
    { time: "14:10", court: "コートB", aRank: 2, bRank: 2, ref1Rank: 5, ref1Group: GROUP_A, ref2Rank: 5, ref2Group: GROUP_B, label: "3位決定戦" },
  ];

  for (const m of rankMatchDefs) {
    await put(TABLES.matches, {
      id: nanoid(), eventId: EVENT_ID, type: "custom-league",
      groupId: null, customLeagueId: CL_ID,
      teamAId: null, teamBId: null,
      teamARefLabel: GRP_RANK(GROUP_A, m.aRank),
      teamBRefLabel: GRP_RANK(GROUP_B, m.bRank),
      scoreA: null, scoreB: null, halfScoreA: null, halfScoreB: null,
      scheduledTime: `${D}T${m.time}:00`,
      durationMinutes: 7, court: m.court, status: "scheduled",
      refereeTeamId: null, refereeTeamId2: null,
    });
    console.log(`  ${m.label}: ${m.court} A${m.aRank}位 vs B${m.bRank}位 (審判: A${m.ref1Rank}位/B${m.ref2Rank}位)`);
  }

  console.log("\n✓ シード完了");
}

seed().catch(console.error);
