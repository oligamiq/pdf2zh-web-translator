#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
V2_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$V2_DIR/.env"
COMPOSE_FILE="$V2_DIR/docker-compose.yml"
WORKER_TOML="$V2_DIR/worker/wrangler.toml"

echo "=== Production Preflight Check ==="

# 1. 必要なツールの確認
for cmd in npm npx docker curl jq go; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "❌ Missing command: $cmd"
    exit 1
  fi
done

# 2. .env と必須環境変数の確認
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Missing .env file: $ENV_FILE"
  exit 1
fi
source "$ENV_FILE"

check_env() {
  local var_name="$1"
  local val="${!var_name}"
  if [ -z "$val" ]; then
    echo "❌ Missing required env: $var_name"
    exit 1
  else
    echo "✅ $var_name: set"
  fi
}

echo "--- Checking Environment Variables ---"
check_env "PC_AGENT_MODE"
if [ "$PC_AGENT_MODE" != "prod" ]; then
  echo "❌ PC_AGENT_MODE must be 'prod'. Current is: $PC_AGENT_MODE"
  exit 1
fi

check_env "AUTH_MODE"
if [ "$AUTH_MODE" != "firebase" ]; then
  echo "❌ AUTH_MODE must be 'firebase' for production."
  exit 1
fi

check_env "FIREBASE_PROJECT_ID"
check_env "AGENT_TOKEN"
check_env "PROXY_SECRET"
check_env "HDD_BASE"
check_env "WORKER_API_BASE_URL"
check_env "USER_SETTINGS_SECRET"

if [ "$PDF2ZH_TRANSLATOR_SERVICE" = "openaicompatible" ]; then
  check_env "PDF2ZH_OPENAI_COMPATIBLE_API_KEY"
fi

echo "--- Checking Forbidden E2E Variables ---"
FORBIDDEN_PROD_ENVS=(
  FIREBASE_JWKS_OVERRIDE_JSON
  FIREBASE_JWKS_OVERRIDE_FILE
  FIREBASE_ISSUER_OVERRIDE
)
for name in "${FORBIDDEN_PROD_ENVS[@]}"; do
  if [ -n "${!name:-}" ]; then
    echo "❌ Forbidden E2E-only env is set in production preflight: $name"
    exit 1
  else
    echo "✅ $name: not set"
  fi
done

# 3. HDD_BASE ディレクトリの確認
echo "--- Checking HDD Directories ---"
for d in uploads outputs logs work cache tmp; do
  path="$HDD_BASE/data/$d"
  if [ ! -d "$path" ]; then
    echo "❌ Missing directory: $path"
    exit 1
  fi
  if [ ! -w "$path" ]; then
    echo "❌ Directory not writable: $path"
    exit 1
  fi
done
echo "✅ HDD directories exist and are writable."

# 4. D1 Schema 確認
echo "--- Checking D1 Schema ---"
if [ ! -f "$V2_DIR/worker/schema.sql" ]; then
  echo "❌ Missing D1 schema: worker/schema.sql"
  exit 1
fi
echo "✅ D1 schema file exists."

# 5. cloudflared 設定確認
echo "--- Checking cloudflared ---"
if ! command -v cloudflared &> /dev/null; then
  echo "⚠️ Warning: cloudflared command not found on host. Ensure it runs via container or another method."
else
  echo "✅ cloudflared command is available."
fi

# 6. Worker config & dry-run build
echo "--- Checking Worker ---"
if [ ! -f "$WORKER_TOML" ]; then
  echo "❌ Missing wrangler.toml: $WORKER_TOML"
  exit 1
fi
if ! grep -q 'AUTH_MODE = "firebase"' "$WORKER_TOML"; then
  echo "❌ wrangler.toml must set AUTH_MODE = \"firebase\""
  exit 1
fi
(
  cd "$V2_DIR/worker"
  echo "Installing worker deps..."
  npm install --silent
  echo "Running wrangler deploy --dry-run..."
  if ! npx wrangler deploy --dry-run --outdir dist > /dev/null 2>&1; then
     echo "❌ Worker dry-run deploy failed."
     npx wrangler deploy --dry-run --outdir dist
     exit 1
  fi
)
echo "✅ Worker build/dry-run passed."

# 7. Frontend build 確認
echo "--- Checking Frontend ---"
if [ -d "$V2_DIR/frontend" ]; then
  (
    cd "$V2_DIR/frontend"
    echo "Installing frontend deps..."
    npm install --silent
    echo "Building frontend..."
    if ! npm run build > /dev/null 2>&1; then
      echo "❌ Frontend build failed."
      npm run build
      exit 1
    fi
  )
  echo "✅ Frontend build passed."
else
  echo "❌ Missing frontend directory."
  exit 1
fi

# 8. pc-api Docker build 確認
echo "--- Checking pc-api Docker Build ---"
(
  cd "$V2_DIR"
  echo "Building pc-api container..."
  if ! docker compose -f "$COMPOSE_FILE" build pc-api > /dev/null 2>&1; then
    echo "❌ pc-api Docker build failed."
    docker compose -f "$COMPOSE_FILE" build pc-api
    exit 1
  fi
)
echo "✅ pc-api Docker build passed."

echo "=== Production Preflight Passed ==="
