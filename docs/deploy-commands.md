# Deployment & Migration Commands

各コンポーネントをデプロイ、またはマイグレーションするためのコマンド一覧です。

## Preflight Check (デプロイ前確認)

本番環境にデプロイする前に、すべての設定・環境変数・必須ファイルが揃っているか、破壊的操作なしで自動チェックします。

```bash
cd /srv/pdf2zh-web/v2
./scripts/preflight-prod.sh
```

## Cloudflare D1

```bash
# 1. データベースの作成
npx wrangler d1 create pdf2zh-db

# 2. マイグレーション (ローカル開発用)
npx wrangler d1 execute pdf2zh-db --local --file=./schema.sql

# 3. マイグレーション (本番・リモート用)
npx wrangler d1 execute pdf2zh-db --remote --file=./schema.sql
```

## Cloudflare Worker

```bash
# ディレクトリ移動
cd v2/worker

# ローカル開発 (mockモード推奨)
npm run dev

# 本番へのデプロイ
npm run deploy

# 本番用シークレットの設定
npx wrangler secret put PROXY_SECRET
npx wrangler secret put AGENT_TOKEN
```

## Frontend (SolidJS)

```bash
# ディレクトリ移動
cd v2/frontend

# ローカル開発
npm run dev

# 本番用ビルド確認
npm run build
```

**Cloudflare Pages 構築設定 (ダッシュボード上)**:
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `v2/frontend`

## PC Docker (Agent & API)

```bash
# ディレクトリ移動
cd v2

# ビルドしてバックグラウンド起動
docker compose up -d --build

# ログ確認
docker compose logs -f

# 停止
docker compose down
```

## Cloudflare Tunnel / Workers VPC Service

```bash
# 1. Cloudflare Dashboard から Workers VPC 用の Tunnel を作成し、Host PC にインストール
# (Dashboard -> Networks -> Tunnels)
# 注意: Zero Trust の Published application や Public hostname は作成しない

# 2. Host PC 側で pc-api が 127.0.0.1:8789 で動いていることを確認 (docker-compose)

# 3. Worker 側で VPC Service を作成
cd /srv/pdf2zh-web/v2/worker
npx wrangler vpc service create pdf2zh-pc-api \
  --type http \
  --tunnel-id "<TUNNEL_ID>" \
  --hostname localhost \
  --http-port 8789

# 4. wrangler config に vpc_services 追記
# [[vpc_services]]
# binding = "PC_API_VPC"
# service_id = "019f02f0-2940-7b92-9fed-02b6a692f41f"
# remote = true

# 5. VPC 疎通確認
./scripts/prod-vpc-smoke.sh
```
