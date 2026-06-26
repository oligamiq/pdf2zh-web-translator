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
check_env "TURNSTILE_SECRET_KEY"
check_env "PUBLIC_RATE_LIMIT_SALT"

if [ ${#USER_SETTINGS_SECRET} -ne 44 ] && [ ${#USER_SETTINGS_SECRET} -ne 43 ]; then
  echo "❌ USER_SETTINGS_SECRET must be 32 bytes base64 encoded (length 43/44). Current length is: ${#USER_SETTINGS_SECRET}"
  exit 1
fi
echo "✅ USER_SETTINGS_SECRET is base64 32 bytes."

if [ "$PDF2ZH_TRANSLATOR_SERVICE" = "openaicompatible" ]; then
  check_env "PDF2ZH_OPENAI_COMPATIBLE_API_KEY"
fi

echo "--- Checking Forbidden E2E Variables ---"
FORBIDDEN_PROD_ENVS=(
  FIREBASE_JWKS_OVERRIDE_JSON
  FIREBASE_JWKS_OVERRIDE_FILE
  FIREBASE_ISSUER_OVERRIDE
  TURNSTILE_TEST_BYPASS
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

echo "Checking remote tables..."
(
  cd "$V2_DIR/worker"
  
  echo "Checking 'jobs' table..."
  if ! npx wrangler d1 execute pdf2zh-db --remote --command "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='jobs';" | grep -q '│ 1'; then
     echo "❌ Table 'jobs' does not exist in remote DB. Did you apply migrations?"
     exit 1
  fi
  
  echo "Checking 'user_llm_settings' table..."
  if ! npx wrangler d1 execute pdf2zh-db --remote --command "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='user_llm_settings';" | grep -q '│ 1'; then
     echo "❌ Table 'user_llm_settings' does not exist in remote DB. Did you apply migrations?"
     exit 1
  fi
  
  echo "Checking 'public_rate_limits' table..."
  if ! npx wrangler d1 execute pdf2zh-db --remote --command "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='public_rate_limits';" | grep -q '│ 1'; then
     echo "❌ Table 'public_rate_limits' does not exist in remote DB. Did you apply migrations (0003_add_public_jobs)?"
     exit 1
  fi
)
echo "✅ Remote tables exist."

# 5. cloudflared 設定確認
echo "--- Checking cloudflared ---"
check_env "CLOUDFLARE_TUNNEL_TOKEN"
(
  cd "$V2_DIR"
  if ! docker compose config --services | grep -q "^cloudflared$"; then
    echo "❌ cloudflared service not found in docker-compose.yml"
    exit 1
  fi
  echo "✅ cloudflared compose service exists."
  
  if ! docker compose config | grep -q "image: cloudflare/cloudflared"; then
    echo "❌ cloudflared image (cloudflare/cloudflared) not found in docker compose config"
    exit 1
  fi
  echo "✅ cloudflared image is configured."
)

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
if ! grep -q '\[\[d1_databases\]\]' "$WORKER_TOML"; then
  echo "❌ wrangler.toml must contain a D1 binding ([[d1_databases]])"
  exit 1
fi
D1_DB_ID=$(grep -E '^\s*database_id\s*=' "$WORKER_TOML" | cut -d '"' -f 2)
if [ -z "$D1_DB_ID" ]; then
  echo "❌ d1_databases.database_id is empty or missing in wrangler.toml"
  exit 1
fi
if [[ "$D1_DB_ID" =~ placeholder|TODO|\<.*DB.*\>|your-d1-uuid-here ]]; then
  echo "❌ d1_databases.database_id is still a placeholder: $D1_DB_ID"
  exit 1
fi
if ! [[ "$D1_DB_ID" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
  echo "❌ d1_databases.database_id is not a valid UUID: $D1_DB_ID"
  exit 1
fi
echo "✅ D1 database_id is configured correctly."

echo "--- Checking VPC Service Binding ---"
if ! grep -q '\[\[vpc_services\]\]' "$WORKER_TOML"; then
  echo "❌ wrangler.toml must contain a VPC Service binding ([[vpc_services]])"
  exit 1
fi
if ! grep -q 'binding = "PC_API_VPC"' "$WORKER_TOML"; then
  echo "❌ wrangler.toml must set binding = \"PC_API_VPC\""
  exit 1
fi

VPC_SERVICE_ID=$(grep -E '^\s*service_id\s*=' "$WORKER_TOML" | cut -d '"' -f 2)
if [ -z "$VPC_SERVICE_ID" ]; then
  echo "❌ vpc_services.service_id is empty or missing in wrangler.toml"
  exit 1
fi

if [[ "$VPC_SERVICE_ID" =~ placeholder|TODO|\<.*SERVICE.*\>|^$ ]]; then
  echo "❌ vpc_services.service_id is still a placeholder: $VPC_SERVICE_ID"
  exit 1
fi
echo "✅ VPC Service binding is correctly configured."

echo "--- Checking Public Fallback LLM ---"
FALLBACK_ENABLED=$(grep -E '^\s*PUBLIC_FALLBACK_LLM_ENABLED\s*=' "$WORKER_TOML" | cut -d '"' -f 2 || echo "")
if [ "$FALLBACK_ENABLED" = "true" ]; then
  echo "Public Fallback LLM is ENABLED. Checking configurations..."
  
  FALLBACK_SOURCE=$(grep -E '^\s*PUBLIC_FALLBACK_LLM_SOURCE\s*=' "$WORKER_TOML" | cut -d '"' -f 2 || echo "")
  FALLBACK_BASE_URL=$(grep -E '^\s*PUBLIC_FALLBACK_LLM_BASE_URL\s*=' "$WORKER_TOML" | cut -d '"' -f 2 || echo "")
  FALLBACK_MODEL=$(grep -E '^\s*PUBLIC_FALLBACK_LLM_MODEL\s*=' "$WORKER_TOML" | cut -d '"' -f 2 || echo "")
  
  if [ -z "$FALLBACK_SOURCE" ] || [ -z "$FALLBACK_BASE_URL" ] || [ -z "$FALLBACK_MODEL" ]; then
    echo "❌ PUBLIC_FALLBACK_LLM_ENABLED is true, but SOURCE, BASE_URL or MODEL are missing in wrangler.toml [vars]"
    exit 1
  fi
  
  if [[ "$FALLBACK_SOURCE" == "openaicompatible" || "$FALLBACK_SOURCE" == "gemini" ]]; then
    echo "⚠️ Note: $FALLBACK_SOURCE requires PUBLIC_FALLBACK_LLM_API_KEY. Ensure it is set via 'wrangler secret put PUBLIC_FALLBACK_LLM_API_KEY'"
  fi
  echo "✅ Public Fallback LLM configuration looks good."
else
  echo "✅ Public Fallback LLM is DISABLED (PUBLIC_FALLBACK_LLM_ENABLED is false or not true)."
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
    echo "Running frontend E2E tests..."
    if ! npm run test:e2e > /dev/null 2>&1; then
      echo "❌ Frontend E2E tests failed."
      npm run test:e2e
      exit 1
    fi
  )
  echo "✅ Frontend build and test:e2e passed."
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
