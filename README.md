# Kick Summit App

フットサル大会の運営・観戦を支援するWebアプリケーション。

## 前提条件

- Node.js 22 以上
- pnpm 10 以上
- Docker (ローカルDB用)
- AWS CLI (デプロイ用、ローカル開発のみなら不要)

## セットアップ

```bash
# 依存関係インストール
pnpm install

# DynamoDB Local 起動
pnpm db:start

# テーブル作成 + サンプルデータ投入
pnpm db:seed

# 開発サーバー起動 (http://localhost:3000)
pnpm dev
```

## コマンド一覧

| コマンド | 説明 |
|---|---|
| `pnpm dev` | 開発サーバー起動 |
| `pnpm build` | プロダクションビルド |
| `pnpm type-check` | TypeScript 型チェック |
| `pnpm lint` | ESLint 実行 |
| `pnpm db:start` | DynamoDB Local 起動 |
| `pnpm db:stop` | DynamoDB Local 停止 |
| `pnpm db:seed` | ローカルDBにシードデータ投入 |
| `pnpm db:seed:remote` | AWS DynamoDB にシードデータ投入 |

## デプロイ

AWS CLI の認証情報が設定済みで、Docker が起動していることを確認してください。

```bash
# 初回のみ: CDK Bootstrap
cd packages/infra && pnpm cdk bootstrap

# デプロイ
cd packages/infra && pnpm cdk deploy

# 全リソース削除
cd packages/infra && pnpm cdk destroy
```

デプロイ完了後、CloudFront URL が出力されます。

## 管理者モード

サンプルデータのパスワード: `admin`

アプリ下部メニューの「その他」から管理者ログインできます。
