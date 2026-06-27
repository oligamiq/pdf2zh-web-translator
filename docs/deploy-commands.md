# Deployment & Migration Commands

各コンポーネントをデプロイ、またはマイグレーションするためのコマンド一覧です。

## Preflight Check (デプロイ前確認) & Deploy

本番環境にデプロイする前に、すべての設定・環境変数・必須ファイルが揃っているか、破壊的操作なしで自動チェックし、安全にデプロイします。

```bash
cd /srv/pdf2zh-web/v2
npm install
npm run verify
npm run deploy
```

## Cloudflare D1

```bash
# 1. データベースの作成
npx wrangler d1 create pdf2zh-db

# 2. マイグレーション (ローカル開発用)
npx wrangler d1 execute pdf2zh-db --local --file=./schema.sql

# 3. マイグレーション (本番・リモート用)
cd /srv/pdf2zh-web/v2
npm --prefix worker run migrate:remote
```

## 本番用シークレットの設定 (Worker)

初回構築時やキー変更時のみ実行してください。デプロイフローには含まれません。

```bash
cd /srv/pdf2zh-web/v2
npm --prefix worker run secret:turnstile
npx wrangler secret put PROXY_SECRET
npx wrangler secret put AGENT_TOKEN
npx wrangler secret put USER_SETTINGS_SECRET
npx wrangler secret put PUBLIC_RATE_LIMIT_SALT
npx wrangler secret put PUBLIC_FALLBACK_LLM_API_KEY
# (Note: APIキーなしの public fallback を有効にするには、wrangler.toml の vars で
# PUBLIC_FALLBACK_LLM_ENABLED="true" とし、SOURCE, BASE_URL, MODEL も設定する必要があります。
# 未設定の場合は自動的にフォールバックが無効化され、利用できません)
```

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
# 1. Cloudflare Dashboard から Workers VPC 用の Tunnel を作成
# (Dashboard -> Networks -> Tunnels)
# 注意: Zero Trust の Published application や Public hostname は作成しない
# インストールコマンドから token のみを抽出し、Host PCの .env に設定する
# CLOUDFLARE_TUNNEL_TOKEN="<extracted_token_here>"
# token は git にコミットしないこと

# 2. Host PC 側で docker compose を起動
cd /srv/pdf2zh-web/v2
docker compose up -d --build pc-api cloudflared

# 3. Worker 側で VPC Service を作成
cd /srv/pdf2zh-web/v2/worker
npx wrangler vpc service create pdf2zh-pc-api \
  --type http \
  --tunnel-id "<TUNNEL_ID>" \
  --hostname pc-api \
  --http-port 8080

# 4. wrangler config に vpc_services 追記
# [[vpc_services]]
# binding = "PC_API_VPC"
# service_id = "019f02f0-2940-7b92-9fed-02b6a692f41f"
# remote = true

# 5. VPC 疎通確認
./scripts/prod-vpc-smoke.sh
```
