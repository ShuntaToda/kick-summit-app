# DB設計相談メモ

## 前提条件

- AWS で完結すること
- 金額がかからないこと（DynamoDB無料枠: 25GB + 読み書き各25ユニット/秒）
- フットサル大会管理アプリ（チーム6〜10、試合15〜20程度）
- 今後の機能拡張あり（得点者記録、警告管理など）
- DynamoDB の Multi-Attribute Composite Keys（2025年11月リリース）を活用

---

## 案1: マルチテーブル（非正規化+GSI）

tournaments, groups, teams, matches, brackets の5テーブル。
各テーブルに PK: `id`。関連IDを非正規化して各アイテムに持たせる。

例: teams テーブル

| PK: id | tournamentId | groupId | name | color | ... |
|---|---|---|---|---|---|
| t1 | default | A | チーム1 | #ff0000 | ... |

各テーブルに Multi-Attribute Composite Keys GSI を設定し、1クエリで取得可能にする。

### GSI 例

| テーブル | GSI | PK属性 | SK属性 | 用途 |
|---|---|---|---|---|
| teams | tournamentId-index | tournamentId | id | 全チーム取得 |
| teams | groupId-index | groupId | id | グループ内チーム |
| matches | schedule-index | [tournamentId, type] | scheduledTime | タイムテーブル |
| matches | status-index | [tournamentId, status] | scheduledTime | ステータス別 |
| matches | group-index | groupId | scheduledTime | グループ内試合 |

### メリット

- テーブル構造が直感的で理解しやすい
- 各エンティティの責務が明確
- AWS Console 上でテーブル単位でデータを確認・修正しやすい
- 非正規化+GSI でカスケードクエリも回避可能

### デメリット

- 5テーブルの管理が必要（CDK定義、ローカルDB構築など）
- GSI がテーブルごとに必要で合計数が多くなる
- テーブル間のデータ整合性はアプリ側で担保する必要がある（DynamoDBにFKはない）

---

## 案2: シングルテーブル（DynamoDBネイティブ）

1テーブルに全エンティティを格納。
全アイテムに `tournamentId`, `entityType`, `groupId` 等を非正規化して持たせる。
Multi-Attribute Composite Keys の GSI で全アクセスパターンを1クエリでカバー。

### テーブル: `kick-summit`

PK: `id`（GetItem 用）

| entityType | 主要属性 |
|---|---|
| `tournament` | name, date, passwordHash, courtFee, partyFeePerPerson |
| `group` | tournamentId, name |
| `team` | tournamentId, groupId, name, color, partyCount, receiptName |
| `match` | tournamentId, groupId, type, teamAId, teamBId, scoreA, scoreB, halfScoreA, halfScoreB, scheduledTime, court, status |
| `bracket` | tournamentId, round, slot, matchId, homeSeed, awaySeed |

### GSI（Multi-Attribute Composite Keys）

| GSI名 | PK属性 | SK属性 | 用途 |
|---|---|---|---|
| `entity-index` | [`tournamentId`, `entityType`] | `id` | エンティティ種別ごとの一覧 |
| `group-entity-index` | [`groupId`, `entityType`] | `id` | グループ内のチーム・試合 |
| `match-schedule-index` | [`tournamentId`, `type`] | `scheduledTime` | タイムテーブル（種別×時間順） |
| `match-status-index` | [`tournamentId`, `status`] | `scheduledTime` | ステータス別試合取得 |

### アクセスパターン → 全て1回のクエリ

| 画面 | やりたいこと | GSI | クエリ条件 |
|---|---|---|---|
| タイムテーブル | リーグ試合を時間順 | match-schedule-index | tournamentId=x, type=league |
| タイムテーブル | トーナメント試合を時間順 | match-schedule-index | tournamentId=x, type=tournament |
| リーグ表 | グループ内の試合 | group-entity-index | groupId=A, entityType=match |
| リーグ表 | グループ内のチーム | group-entity-index | groupId=A, entityType=team |
| トーナメント表 | 全トーナメント枠 | entity-index | tournamentId=x, entityType=bracket |
| スコア入力 | 進行中の試合 | match-status-index | tournamentId=x, status=ongoing |
| チーム管理 | 全チーム | entity-index | tournamentId=x, entityType=team |
| 会計 | 大会設定取得 | entity-index | tournamentId=x, entityType=tournament |
| 会計 | 全チーム取得 | entity-index | tournamentId=x, entityType=team |
| 個別取得 | 試合1件 | メインテーブル | GetItem(id=m1) |

### メリット

- **カスケードクエリ: ゼロ。全て1発で取れる**
- DynamoDB の強みを最大限活かせる
- テーブル管理が1つで済む
- GSI 4つで全アクセスパターンをカバー

### デメリット

- テーブル構造が直感的ではない（慣れが必要）
- AWS Console でのデータ確認時に entityType でフィルタが必要
- データの非正規化により、更新時に複数アイテムへの反映が必要な場合がある
  - ただしこの規模では影響が小さい（チーム名変更時くらい）

---

## 比較まとめ

| | マルチテーブル | シングルテーブル |
|---|---|---|
| カスケードクエリ | 非正規化+GSI で回避可能 | 同様に回避可能 |
| 直感性 | テーブルごとに明確 | entityType で混在 |
| GSI合計数 | テーブルごとに必要（多め） | 1テーブルに集約（少なめ） |
| Console での確認 | テーブル単位で見やすい | フィルタが必要 |
| テーブル管理 | 5テーブル | 1テーブル |
| 拡張時 | テーブル追加 | entityType + GSI 追加 |
| ローカル開発 | 5テーブル分のセットアップ | 1テーブルのみ |

## 結論: マルチテーブルを採用

### 理由

- テーブルごとに独立して拡張・管理できる
- 将来 users テーブルや participants テーブルを追加しても既存に影響なし
- Console でのデバッグ・データ確認が容易
- 非正規化+GSI でカスケードクエリも回避可能なため、クエリ性能はシングルテーブルと同等

### 認証の方針（将来）

- 認証: Amazon Cognito（無料枠: 50,000 MAU）
- ユーザーデータ: users テーブル（DynamoDB）
- 大会への参加関係: participants テーブル（tournamentId, userId, teamId）
- ユーザーはトーナメントに依存しない独立エンティティとして管理

### 採用するテーブル構成

| テーブル | PK | 主要属性 |
|---|---|---|
| tournaments | id | name, date, passwordHash, courtFee, partyFeePerPerson |
| groups | id | tournamentId, name |
| teams | id | tournamentId, groupId, name, color, partyCount, receiptName |
| matches | id | tournamentId, groupId, type, teamAId, teamBId, scoreA, scoreB, halfScoreA, halfScoreB, scheduledTime, court, status |
| brackets | id | tournamentId, round, slot, matchId, homeSeed, awaySeed |

### GSI 一覧

| テーブル | GSI | PK属性 | SK属性 | 用途 |
|---|---|---|---|---|
| groups | tournamentId-index | tournamentId | id | 大会のグループ一覧 |
| teams | tournamentId-index | tournamentId | id | 全チーム取得 |
| teams | groupId-index | groupId | id | グループ内チーム |
| matches | schedule-index | [tournamentId, type] | scheduledTime | タイムテーブル |
| matches | status-index | [tournamentId, status] | scheduledTime | ステータス別 |
| matches | group-index | groupId | scheduledTime | グループ内試合 |
| brackets | tournamentId-index | tournamentId | id | トーナメント枠一覧 |
