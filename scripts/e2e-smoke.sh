#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
V2_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$V2_DIR/.env"
COMPOSE_FILE="$V2_DIR/docker-compose.yml"

RUN_ID="$(date +%Y%m%d-%H%M%S)-$$"
TMP_DIR="$V2_DIR/.tmp/e2e-$RUN_ID"
mkdir -p "$TMP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: .env file not found: $ENV_FILE"
  exit 1
fi

export COMPOSE_PROJECT_NAME="pdf2zh-e2e"

echo "1. Generating dynamic ports and secrets..."
WORKER_PORT="$(python3 - <<'PY'
import socket
s = socket.socket()
s.bind(("127.0.0.1", 0))
print(s.getsockname()[1])
s.close()
PY
)"
PC_API_PORT="$(python3 - <<'PY'
import socket
s = socket.socket()
s.bind(("127.0.0.1", 0))
print(s.getsockname()[1])
s.close()
PY
)"

E2E_PROXY_SECRET="$(python3 - <<'PY'
import secrets
print(secrets.token_urlsafe(48))
PY
)"

E2E_AGENT_TOKEN="$(python3 - <<'PY'
import secrets
print(secrets.token_urlsafe(48))
PY
)"

WORKER_HOST_URL="http://localhost:${WORKER_PORT}"
WORKER_CONTAINER_URL="http://host.docker.internal:${WORKER_PORT}"
PC_API_HOST_URL="http://127.0.0.1:${PC_API_PORT}"
WORKER_LOG="$TMP_DIR/worker.log"
PC_API_LOG="$TMP_DIR/pc-api.log"
UPLOAD_BODY="$TMP_DIR/upload-response.json"
UPLOAD_STATUS="$TMP_DIR/upload-status.txt"

echo "2. Creating temporary files in E2E debug dir: $TMP_DIR"
TMP_ENV="$TMP_DIR/env"
TMP_COMPOSE_OVERRIDE="$TMP_DIR/docker-compose.override.yml"
TMP_WRANGLER="$V2_DIR/worker/wrangler.e2e.toml"

echo "E2E mode: mock"
echo "Worker dev: $WORKER_HOST_URL"
echo "Private API URL for Worker: $PC_API_HOST_URL"
echo "Agent worker URL inside container: $WORKER_CONTAINER_URL"

grep -v -E '^(PC_AGENT_MODE|WORKER_API_BASE_URL_MOCK|AUTH_MODE|PROXY_SECRET|AGENT_TOKEN)=' "$ENV_FILE" > "$TMP_ENV"
cat >> "$TMP_ENV" <<EOF
PC_AGENT_MODE=mock
WORKER_API_BASE_URL_MOCK=${WORKER_CONTAINER_URL}
AUTH_MODE=mock
PROXY_SECRET=${E2E_PROXY_SECRET}
AGENT_TOKEN=${E2E_AGENT_TOKEN}
PC_AGENT_AUTOSTART=false
EOF

cat > "$TMP_COMPOSE_OVERRIDE" <<EOF
services:
  pc-api:
    ports:
      - "127.0.0.1:${PC_API_PORT}:8081"
EOF

cp "$V2_DIR/worker/wrangler.toml" "$TMP_WRANGLER"
cat >> "$TMP_WRANGLER" <<EOF

PRIVATE_API_BASE_URL = "${PC_API_HOST_URL}"
PROXY_SECRET = "${E2E_PROXY_SECRET}"
AGENT_TOKEN = "${E2E_AGENT_TOKEN}"
EOF

DEV_VARS="$V2_DIR/worker/.dev.vars"
DEV_VARS_BAK="$TMP_DIR/.dev.vars.bak"
DEV_VARS_EXISTED=0

if [ -f "$DEV_VARS" ]; then
  echo "Backing up existing .dev.vars to $DEV_VARS_BAK..."
  cp "$DEV_VARS" "$DEV_VARS_BAK"
  DEV_VARS_EXISTED=1
fi

restore_dev_vars() {
  if [ "$DEV_VARS_EXISTED" = "1" ]; then
    echo "Restoring .dev.vars from $DEV_VARS_BAK..."
    cp "$DEV_VARS_BAK" "$DEV_VARS"
  else
    rm -f "$DEV_VARS"
  fi
}

WORKER_PID=""
cleanup() {
  echo "16. Stopping Worker dev server (PID: ${WORKER_PID:-none})..."
  if [ -n "${WORKER_PID:-}" ]; then
    kill "$WORKER_PID" 2>/dev/null || true
  fi

  echo "17. Cleaning up Docker Compose project $COMPOSE_PROJECT_NAME..."
  docker compose \
    --env-file "$TMP_ENV" \
    -f "$COMPOSE_FILE" \
    -f "$TMP_COMPOSE_OVERRIDE" \
    down --remove-orphans >/dev/null 2>&1 || true

  echo "18. Cleaning up temporary files (leaving logs in $TMP_DIR)..."
  rm -f "$TMP_WRANGLER"
  restore_dev_vars
}
trap cleanup EXIT INT TERM

echo "3. Creating host directories..."

read_env_value() {
  local key="$1"
  local file="$2"

  grep -E "^${key}=" "$file" \
    | tail -n 1 \
    | cut -d= -f2- \
    | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

HDD_BASE_VALUE="$(read_env_value HDD_BASE "$TMP_ENV")"

if [ -z "$HDD_BASE_VALUE" ]; then
  echo "❌ Error: HDD_BASE is not set in $TMP_ENV"
  exit 1
fi

echo "Creating host data directories under: $HDD_BASE_VALUE/data"

for d in uploads outputs logs work cache tmp; do
  path="$HDD_BASE_VALUE/data/$d"
  if ! mkdir -p "$path" 2>/dev/null; then
    echo "❌ Failed to create directory: $path"
    echo "Current user: $(id)"
    ls -ld "$HDD_BASE_VALUE" "$HDD_BASE_VALUE/data" 2>/dev/null || true
    echo ""
    echo "Please run the following on the host to fix permissions:"
    echo "sudo mkdir -p $HDD_BASE_VALUE/data/{uploads,outputs,logs,work,cache,tmp}"
    echo "sudo chown -R \"\$USER:\$USER\" $HDD_BASE_VALUE"
    exit 1
  fi
done

for d in uploads outputs logs work cache tmp; do
  path="$HDD_BASE_VALUE/data/$d"
  if [ ! -w "$path" ]; then
    echo "❌ Directory is not writable: $path"
    ls -ld "$path"
    id
    echo ""
    echo "Please run the following on the host to fix permissions:"
    echo "sudo chown -R \"\$USER:\$USER\" $HDD_BASE_VALUE"
    exit 1
  fi
done

echo "✅ Host data directories are ready."

WRANGLER_PERSIST_DIR="$TMP_DIR/wrangler-state"
mkdir -p "$WRANGLER_PERSIST_DIR"
echo "D1 local persist: $WRANGLER_PERSIST_DIR"

echo "3.5. Applying D1 local schema..."
D1_SCHEMA_FILE="$V2_DIR/worker/schema.sql"
if [ ! -f "$D1_SCHEMA_FILE" ]; then
  echo "❌ D1 schema file not found: $D1_SCHEMA_FILE"
  exit 1
fi

(
  cd "$V2_DIR/worker"
  npx wrangler d1 execute pdf2zh-db \
    --local \
    --persist-to "$WRANGLER_PERSIST_DIR" \
    --file "$D1_SCHEMA_FILE" \
    -c wrangler.e2e.toml > "$TMP_DIR/worker-d1-schema.log" 2>&1 || {
      echo "❌ D1 schema apply failed. Check $TMP_DIR/worker-d1-schema.log"
      cat "$TMP_DIR/worker-d1-schema.log"
      exit 1
    }
)

echo "4. Starting Worker dev server in background..."

cat > "$DEV_VARS" <<EOF
AUTH_MODE="mock"
PRIVATE_API_BASE_URL="${PC_API_HOST_URL}"
PROXY_SECRET="${E2E_PROXY_SECRET}"
AGENT_TOKEN="${E2E_AGENT_TOKEN}"
EOF

(
  cd "$V2_DIR/worker"
  npm install > "$TMP_DIR/worker-npm-install.log" 2>&1
  npx wrangler dev -c wrangler.e2e.toml --ip 0.0.0.0 --port "$WORKER_PORT" --persist-to "$WRANGLER_PERSIST_DIR" > "$WORKER_LOG" 2>&1
) &
WORKER_PID="$!"

echo "5. Waiting for Worker /healthz (up to 30s)..."
READY=false
for i in $(seq 1 30); do
  if curl -fsS "${WORKER_HOST_URL}/healthz" >/dev/null 2>&1; then
    echo "✅ Worker dev is ready: ${WORKER_HOST_URL}"
    echo "Worker bindings summary:"
    grep -A 8 -i "Vars:" "$WORKER_LOG" || true
    READY=true
    break
  fi
  sleep 1
done

if [ "$READY" = false ]; then
  echo "❌ Error: Worker failed to start within 30 seconds."
  echo "--- Worker Log (Tail 50) ---"
  tail -n 50 "$WORKER_LOG" || true
  exit 1
fi

echo "6. Starting pc-api container with mock configuration in project $COMPOSE_PROJECT_NAME..."
cd "$V2_DIR"
docker compose \
  --env-file "$TMP_ENV" \
  -f "$COMPOSE_FILE" \
  -f "$TMP_COMPOSE_OVERRIDE" \
  up -d --build --force-recreate pc-api

echo "7. Checking reachability to pc-api locally..."
echo "PC API host URL: $PC_API_HOST_URL"
READY=false

for i in $(seq 1 30); do
  status="$(curl -sS -H "X-Proxy-Secret: ${E2E_PROXY_SECRET}" -o "$TMP_DIR/pc-api-health-body.txt" -w "%{http_code}" \
    "${PC_API_HOST_URL}/internal/healthz" || true)"

  if [ "$status" = "200" ]; then
    echo "✅ pc-api is ready: ${PC_API_HOST_URL}"
    READY=true
    break
  elif [ "$status" = "403" ]; then
    echo "Waiting for pc-api... attempt=$i status=403 (pc-api is reachable, but X-Proxy-Secret is missing or invalid)"
  elif [ "$status" = "000" ]; then
    echo "Waiting for pc-api... attempt=$i status=000 (pc-api is unreachable or port mapping failed)"
  else
    echo "Waiting for pc-api... attempt=$i status=${status:-curl_failed}"
  fi
  cat "$TMP_DIR/pc-api-health-body.txt" 2>/dev/null || true
  sleep 1
done

if [ "$READY" = false ]; then
  echo "❌ Error: pc-api health check failed."
  echo "--- docker compose ps ---"
  docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$TMP_ENV" -f "$COMPOSE_FILE" -f "$TMP_COMPOSE_OVERRIDE" ps
  echo "--- docker compose port ---"
  docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$TMP_ENV" -f "$COMPOSE_FILE" -f "$TMP_COMPOSE_OVERRIDE" port pc-api 8081 || true
  echo "--- pc-api Container Log (Tail 200) ---"
  docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$TMP_ENV" -f "$COMPOSE_FILE" -f "$TMP_COMPOSE_OVERRIDE" logs --tail=200 pc-api || true
  exit 1
fi

echo "8. Checking reachability from pc-api to Worker /healthz..."
docker compose \
  --env-file "$TMP_ENV" \
  -f "$COMPOSE_FILE" \
  -f "$TMP_COMPOSE_OVERRIDE" \
  exec -T pc-api sh -lc '
python3 - <<PY
import os
import urllib.request

base = os.environ["WORKER_API_BASE_URL_MOCK"].rstrip("/")
url = base + "/healthz"
print("Trying to reach", url, "...")
with urllib.request.urlopen(url, timeout=5) as r:
    if r.status < 200 or r.status >= 300:
        raise SystemExit(f"bad status: {r.status}")
print("ok")
PY
' || {
  echo "❌ Error: Cannot reach Worker from inside container."
  echo "--- Worker Log (Tail 160) ---"
  tail -n 160 "$WORKER_LOG" 2>/dev/null || true
  echo "--- pc-api Container Log (Tail 160) ---"
  docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$TMP_ENV" -f "$COMPOSE_FILE" -f "$TMP_COMPOSE_OVERRIDE" logs --tail=160 pc-api || true
  exit 1
}

echo "9. Running pdf2zh_next smoke test in container..."
ENV_FILE="$TMP_ENV" COMPOSE_PROJECT_NAME="$COMPOSE_PROJECT_NAME" COMPOSE_OVERRIDE_FILE="$TMP_COMPOSE_OVERRIDE" "$SCRIPT_DIR/smoke-pdf2zh-next.sh"

print_debug_logs() {
  echo "--- Worker Log (Tail 160) ---"
  tail -n 160 "$WORKER_LOG" 2>/dev/null || true
  echo "--- pc-api Container Log (Tail 240) ---"
  docker compose \
    -p "$COMPOSE_PROJECT_NAME" \
    --env-file "$TMP_ENV" \
    -f "$COMPOSE_FILE" \
    -f "$TMP_COMPOSE_OVERRIDE" \
    logs --tail=240 pc-api || true
}

echo "10. Uploading test PDF to /jobs..."
MOCK_TOKEN="mock-user-123"
TEST_PDF="/tmp/test-smoke.pdf"
echo "%PDF-1.4 dummy pdf" > "$TEST_PDF"

curl -sS \
  -o "$UPLOAD_BODY" \
  -w "%{http_code}" \
  -X POST "${WORKER_HOST_URL}/jobs" \
  -H "Authorization: Bearer $MOCK_TOKEN" \
  -F "pdf=@${TEST_PDF};type=application/pdf" \
  > "$UPLOAD_STATUS"

STATUS="$(cat "$UPLOAD_STATUS")"

echo "POST /jobs status: $STATUS"
echo "POST /jobs response body:"
cat "$UPLOAD_BODY"
echo ""

case "$STATUS" in
  2*) ;;
  *)
    echo "❌ POST /jobs failed with HTTP $STATUS"
    print_debug_logs
    exit 1
    ;;
esac

JOB_ID="$(python3 - "$UPLOAD_BODY" <<'PY'
import json, sys
with open(sys.argv[1], "r", encoding="utf-8") as f:
    data = json.load(f)
print((data.get("job") or {}).get("id") or data.get("id") or "")
PY
)"

if [ -z "$JOB_ID" ]; then
  echo "❌ Failed to get JOB_ID from upload response"
  print_debug_logs
  exit 1
fi
echo "Job created: $JOB_ID"

echo "11. D1 job creation confirmed."

echo "12. Agent claim (mocking agent loop)..."
CLAIM_RES=$(curl -sS -w "\n%{http_code}" -H "Authorization: Bearer ${E2E_AGENT_TOKEN}" -H "Content-Type: application/json" -d '{"worker_id":"e2e-smoke"}' "${WORKER_HOST_URL}/agent/claim")
CLAIM_BODY=$(echo "$CLAIM_RES" | sed '$d')
CLAIM_STATUS=$(echo "$CLAIM_RES" | tail -n1)

echo "Agent claim status: $CLAIM_STATUS"
echo "$CLAIM_BODY"

if [[ "$CLAIM_STATUS" == "401" ]]; then
  echo "❌ Agent claim failed with 401 Unauthorized."
  echo "Worker and pc-api AGENT_TOKEN may be different."
  echo "E2E must inject the same generated AGENT_TOKEN into both TMP_ENV and wrangler.e2e.toml."
  exit 1
fi

CLAIMED_ID=$(echo "$CLAIM_BODY" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ "$CLAIMED_ID" != "$JOB_ID" ]; then
  echo "❌ Claimed ID ($CLAIMED_ID) does not match Uploaded ID ($JOB_ID)"
  exit 1
fi
echo "Agent claim confirmed."

echo "13. Checking log offset API..."
curl -sS -H "Authorization: Bearer $MOCK_TOKEN" "${WORKER_HOST_URL}/jobs/$JOB_ID/log?offset=0"
echo -e "\nLog offset check passed."

echo "14. Agent report success..."
curl -sS -H "Authorization: Bearer ${E2E_AGENT_TOKEN}" -X POST "${WORKER_HOST_URL}/agent/jobs/$JOB_ID/succeeded"
echo -e "\nSuccess report confirmed."

echo "15. Download API check (expect ZIP or success)..."
DL_STATUS=$(curl -s -I -H "Authorization: Bearer $MOCK_TOKEN" -o /dev/null -w "%{http_code}" "${WORKER_HOST_URL}/jobs/$JOB_ID/download")
if [ "$DL_STATUS" != "200" ]; then
  echo "❌ Download API returned $DL_STATUS, expected 200"
  exit 1
fi
echo "Download API check passed."

echo "=== E2E Smoke Test Passed! ==="
