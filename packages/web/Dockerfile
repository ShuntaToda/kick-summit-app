FROM public.ecr.aws/docker/library/node:22-slim AS base

# --- 依存関係インストール ---
FROM base AS deps
WORKDIR /app

# pnpmを有効化
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# ワークスペース設定をコピー
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package.json ./packages/web/

RUN pnpm install --frozen-lockfile --filter @kick-summit/web...

# --- ビルド ---
FROM base AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/web/node_modules ./packages/web/node_modules

COPY packages/shared ./packages/shared
COPY packages/web ./packages/web
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./

RUN pnpm --filter @kick-summit/web build

# --- 実行 ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Lambda Web Adapter をコピー
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:1.0.0-rc1 /lambda-adapter /opt/extensions/lambda-adapter

# Next.js standalone 出力をコピー
COPY --from=builder /app/packages/web/.next/standalone ./
COPY --from=builder /app/packages/web/.next/static ./packages/web/.next/static
COPY --from=builder /app/packages/web/public ./packages/web/public

EXPOSE 8080

CMD ["node", "packages/web/server.js"]
