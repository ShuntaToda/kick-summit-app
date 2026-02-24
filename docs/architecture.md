# Kick Summit App - 技術構成

## 概要

フットサル大会の運営・観戦を支援するWebアプリケーション。
予選リーグ + 決勝トーナメント形式の大会に対応し、参加者向けのリアルタイム情報表示と管理者向けのスコア入力機能を提供する。

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router, Turbopack) |
| ランタイム | React 19, TypeScript 5.7 |
| スタイリング | Tailwind CSS v4, shadcn/ui (new-york) |
| バリデーション | Zod |
| インフラ | AWS CDK v2 (TypeScript) |
| データベース | Amazon DynamoDB (シングルテーブル設計) |
| コンピュート | AWS Lambda (Docker, ARM64) + Lambda Web Adapter |
| API | Amazon API Gateway (HTTP API) |
| CDN | Amazon CloudFront |
| パッケージ管理 | pnpm 10 + Turborepo 2.8 |
| ローカルDB | DynamoDB Local (Docker Compose) |

## モノレポ構成

```
kick-summit-app/
├── packages/
│   ├── web/        # Next.js アプリケーション
│   ├── infra/      # AWS CDK インフラ定義
│   └── shared/     # 共有型定義
├── scripts/        # シード・セットアップスクリプト
└── docker-compose.yml
```

## アーキテクチャ

### フロントエンド (Server Components / Client Components)

```
ページ (Server Component)
  ├── サーバーでデータ取得 (async/await)
  ├── 静的な表示部分はサーバーでレンダリング
  └── インタラクティブな部分のみ Client Component として分離

Refresher (Client Component)
  └── 30秒ごとに router.refresh() でサーバーコンポーネントを再レンダリング
```

**ページ一覧:**

| パス | 種別 | 説明 |
|---|---|---|
| `/` | Server Component | ホーム (次の試合・直近結果・順位) |
| `/timetable` | Server Component | タイムテーブル (予選/決勝タブ) |
| `/league` | Server Component | リーグ順位表 (グループ別タブ) |
| `/tournament` | Server Component | トーナメント表 |
| `/more` | Static | その他 (管理者ログイン) |
| `/admin/score` | Server Component | スコア入力 (管理者専用) |

全ページに `export const dynamic = "force-dynamic"` を設定し、常にSSRで最新データを返す。

### バックエンド (DDD + Server Actions)

```
Server Actions (lib/actions.ts)     ← 薄いエントリーポイント
  └── Application Layer             ← ユースケース / 入力バリデーション (Zod)
      └── Domain Layer              ← エンティティ / ドメインサービス / リポジトリIF
          └── Infrastructure Layer  ← DynamoDB リポジトリ実装
```

- **API Routes は使わない。** すべて Server Actions 経由で実行
- **Zod バリデーション** をドメイン層 (スキーマ定義)、インフラ層 (DB応答のparse)、アプリケーション層 (入力検証) で実施
- **リポジトリパターン** でドメイン層にインターフェースを定義し、インフラ層で DynamoDB 実装

### DynamoDB シングルテーブル設計

| PK | SK パターン | データ |
|---|---|---|
| `TOURNAMENT#default` | `METADATA` | 大会情報 (名前, 日付, パスワード) |
| `TOURNAMENT#default` | `TEAM#{id}` | チーム (名前, グループ, カラー) |
| `TOURNAMENT#default` | `MATCH#{id}` | 試合 (チーム, スコア, ステータス, 時刻) |
| `TOURNAMENT#default` | `BRACKET#{round}#{slot}` | トーナメント組み合わせ |

**GSI:** `status-scheduledTime-index` (ステータス別の試合取得用)

### AWS 構成

```
ユーザー
  → CloudFront (HTTPS, キャッシュ無効)
    → API Gateway (HTTP API)
      → Lambda (Docker/ARM64, 1024MB, 30s timeout)
        → DynamoDB
```

- **Lambda Web Adapter** でNext.jsをそのままLambda上で実行
- Dockerイメージはマルチステージビルド (deps → builder → runner)
- `output: "standalone"` で最小限のサーバーバンドルを生成
- `removalPolicy: DESTROY` で全リソースを簡単に削除可能

## データ同期

- クライアント側の `Refresher` コンポーネントが 30秒間隔で `router.refresh()` を呼び出し
- Next.js がサーバーコンポーネントを再実行し、最新データでDOMを差分更新
- WebSocket / SSE は使わず、シンプルなポーリング方式

## ユーザーロール

| ロール | 機能 |
|---|---|
| 参加者 | チーム選択, タイムテーブル閲覧, リーグ表閲覧, トーナメント表閲覧, ホーム画面 |
| 管理者 | 上記すべて + スコア入力, 試合ステータス変更 (開始/終了) |

管理者モードは「その他」ページからパスワード入力で切り替え。

## コマンド

```bash
# ローカル開発
pnpm db:start          # DynamoDB Local 起動
pnpm db:seed           # ローカルDBにシードデータ投入
pnpm dev               # 開発サーバー起動

# ビルド・検証
pnpm build             # 全パッケージビルド
pnpm type-check        # 型チェック

# デプロイ
cd packages/infra
pnpm cdk bootstrap     # 初回のみ
pnpm cdk deploy        # デプロイ
pnpm cdk destroy       # 全リソース削除

# リモートDBシード
pnpm db:seed:remote    # AWS DynamoDB にシードデータ投入
```
