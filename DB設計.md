# DB設計

DynamoDB マルチテーブル構成。各テーブルに非正規化した関連IDを持たせ、Multi-Attribute Composite Keys GSI で1クエリ取得を実現する。

---

## テーブル一覧

### tournaments

大会の基本情報と費用設定。

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` (PK) | string | o | 大会ID |
| `name` | string | o | 大会名 |
| `date` | string | o | 開催日 (ISO 8601) |
| `passwordHash` | string | o | 管理者パスワードハッシュ |
| `courtFee` | number | o | コート代（全体） |
| `partyFeePerPerson` | number | o | 懇親会費（1人あたり） |

GSI: なし

---

### groups

予選リーグのグループ。

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` (PK) | string | o | グループID |
| `tournamentId` | string | o | → tournaments.id |
| `name` | string | o | グループ名（"A組", "B組"） |

| GSI | PK属性 | SK属性 | 用途 |
|---|---|---|---|
| `tournamentId-index` | `tournamentId` | `id` | 大会のグループ一覧 |

---

### teams

チーム情報。会計データ（懇親会・領収書）も保持。

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` (PK) | string | o | チームID |
| `tournamentId` | string | o | → tournaments.id |
| `groupId` | string | o | → groups.id |
| `name` | string | o | チーム名 |
| `color` | string | o | チームカラー（HEX） |
| `partyCount` | number | o | 懇親会参加人数 |
| `receiptName` | string | | 領収書宛名 |

| GSI | PK属性 | SK属性 | 用途 |
|---|---|---|---|
| `tournamentId-index` | `tournamentId` | `id` | 全チーム取得 |
| `groupId-index` | `groupId` | `id` | グループ内チーム |

---

### matches

試合情報。リーグ戦・トーナメント戦の両方を管理。

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` (PK) | string | o | 試合ID |
| `tournamentId` | string | o | → tournaments.id |
| `type` | string | o | `"league"` / `"tournament"` |
| `groupId` | string \| null | | → groups.id（リーグ戦のみ） |
| `teamAId` | string \| null | | → teams.id（トーナメントは未確定時null） |
| `teamBId` | string \| null | | → teams.id |
| `scoreA` | number \| null | | スコア |
| `scoreB` | number \| null | | スコア |
| `halfScoreA` | number \| null | | 前半スコア |
| `halfScoreB` | number \| null | | 前半スコア |
| `scheduledTime` | string | o | 開始時刻 (ISO 8601) |
| `court` | string | o | コート名 |
| `status` | string | o | `"scheduled"` / `"ongoing"` / `"finished"` |

| GSI | PK属性 | SK属性 | 用途 |
|---|---|---|---|
| `schedule-index` | [`tournamentId`, `type`] | `scheduledTime` | タイムテーブル（種別×時間順） |
| `status-index` | [`tournamentId`, `status`] | `scheduledTime` | ステータス別試合取得 |
| `group-index` | `groupId` | `scheduledTime` | グループ内試合（リーグ表用） |

---

### brackets

決勝トーナメントの枠。シード条件を持ち、リーグ順位確定時に自動マッチングする。

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` (PK) | string | o | スロットID |
| `tournamentId` | string | o | → tournaments.id |
| `round` | number | o | ラウンド（1=準決勝, 2=決勝 等） |
| `slot` | number | o | スロット番号 |
| `matchId` | string | o | → matches.id |
| `homeSeed` | object \| null | | `{ groupId: string, rank: number }` |
| `awaySeed` | object \| null | | `{ groupId: string, rank: number }` |

| GSI | PK属性 | SK属性 | 用途 |
|---|---|---|---|
| `tournamentId-index` | `tournamentId` | `id` | トーナメント枠一覧 |

---

## アクセスパターン

| 画面 | やりたいこと | テーブル | クエリ方法 |
|---|---|---|---|
| タイムテーブル | リーグ試合を時間順 | matches | GSI `schedule-index`: tournamentId=x, type=league |
| タイムテーブル | トーナメント試合を時間順 | matches | GSI `schedule-index`: tournamentId=x, type=tournament |
| リーグ表 | グループ内の試合 | matches | GSI `group-index`: groupId=A |
| リーグ表 | グループ内のチーム | teams | GSI `groupId-index`: groupId=A |
| トーナメント表 | 全トーナメント枠 | brackets | GSI `tournamentId-index`: tournamentId=x |
| スコア入力 | 進行中の試合 | matches | GSI `status-index`: tournamentId=x, status=ongoing |
| チーム管理 | 全チーム | teams | GSI `tournamentId-index`: tournamentId=x |
| 会計 | 大会設定 | tournaments | GetItem(id=x) |
| 会計 | 全チーム | teams | GSI `tournamentId-index`: tournamentId=x |
| 個別取得 | 試合1件 | matches | GetItem(id=x) |

---

## 費用計算ロジック

```
チーム支払額 = (courtFee / チーム数) + (partyFeePerPerson × partyCount)
```

tournaments.courtFee, tournaments.partyFeePerPerson と各 teams.partyCount から算出。

---

## 決勝自動マッチングの流れ

1. リーグ全試合が `finished` になる
2. グループ内の順位を勝点・得失点差で算出
3. brackets の `homeSeed` / `awaySeed` を参照（例: `{ groupId: "A", rank: 1 }`）
4. 該当順位のチームIDを matches の `teamAId` / `teamBId` にセット

---

## 将来の拡張

| 拡張内容 | 対応方法 |
|---|---|
| ユーザー認証 | Cognito + users テーブル追加 |
| 大会への参加登録 | participants テーブル追加（tournamentId, userId, teamId） |
| 得点者記録 | goals テーブル追加（matchId, scorerId, minute） |
| 警告・退場管理 | cards テーブル追加（matchId, playerId, type, minute） |
