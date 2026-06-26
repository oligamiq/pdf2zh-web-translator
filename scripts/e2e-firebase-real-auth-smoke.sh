#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
V2_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$V2_DIR/.env"
COMPOSE_FILE="$V2_DIR/docker-compose.yml"

RUN_ID="$(date +%Y%m%d-%H%M%S)-$$"
TMP_DIR="$V2_DIR/.tmp/e2e-$RUN_ID"
mkdir -p "$TMP_DIR"

if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
fi

if [ -z "$FIREBASE_PROJECT_ID" ] || [ -z "$FIREBASE_WEB_API_KEY" ] || [ -z "$FIREBASE_E2E_EMAIL" ] || [ -z "$FIREBASE_E2E_PASSWORD" ]; then
  echo "❌ Error: Required environment variables are missing."
  echo "Please set FIREBASE_PROJECT_ID, FIREBASE_WEB_API_KEY, FIREBASE_E2E_EMAIL, and FIREBASE_E2E_PASSWORD."
  exit 1
fi

export COMPOSE_PROJECT_NAME="pdf2zh-e2e-fb-real"

echo "1. Generating dynamic ports and secrets..."
WORKER_PORT="$(python3 -c '
import socket
s = socket.socket()
s.bind(("127.0.0.1", 0))
print(s.getsockname()[1])
s.close()
')"
PC_API_PORT="$(python3 -c '
import socket
s = socket.socket()
s.bind(("127.0.0.1", 0))
print(s.getsockname()[1])
s.close()
')"

E2E_PROXY_SECRET="$(python3 -c 'import secrets; print(secrets.token_urlsafe(48))')"
E2E_AGENT_TOKEN="$(python3 -c 'import secrets; print(secrets.token_urlsafe(48))')"

echo "2. Logging into Firebase Auth as E2E test user..."
cat > "$TMP_DIR/firebase-login.py" <<'PY_EOF'
import sys, json, urllib.request, shlex

api_key = sys.argv[1]
email = sys.argv[2]
password = sys.argv[3]

url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
data = json.dumps({"email": email, "password": password, "returnSecureToken": True}).encode()
req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read())
        print(f"export REAL_ID_TOKEN={shlex.quote(res['idToken'])}")
        print(f"export REAL_LOCAL_ID={shlex.quote(res['localId'])}")
except urllib.error.HTTPError as e:
    print(f"Failed to login: HTTP Error {e.code}", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print("Failed to login: Network/Other error", file=sys.stderr)
    sys.exit(1)
PY_EOF

# Evaluate the Python output to export REAL_ID_TOKEN and REAL_LOCAL_ID
eval "$(python3 "$TMP_DIR/firebase-login.py" "$FIREBASE_WEB_API_KEY" "$FIREBASE_E2E_EMAIL" "$FIREBASE_E2E_PASSWORD")"
echo "✅ Firebase login succeeded."
echo "Firebase UID: $REAL_LOCAL_ID"
echo "ID token: set"

WORKER_HOST_URL="http://localhost:${WORKER_PORT}"
WORKER_CONTAINER_URL="http://host.docker.internal:${WORKER_PORT}"
PC_API_HOST_URL="http://127.0.0.1:${PC_API_PORT}"
WORKER_LOG="$TMP_DIR/worker.log"
PC_API_LOG="$TMP_DIR/pc-api.log"

echo "3. Creating temporary files in E2E debug dir: $TMP_DIR"
TMP_ENV="$TMP_DIR/env"
TMP_COMPOSE_OVERRIDE="$TMP_DIR/docker-compose.override.yml"
TMP_WRANGLER="$V2_DIR/worker/wrangler.e2e.toml"

echo "Firebase Real Auth E2E mode"
echo "Worker dev: $WORKER_HOST_URL"
echo "Private API URL for Worker: $PC_API_HOST_URL"
echo "Agent worker URL inside container: $WORKER_CONTAINER_URL"

grep -v -E '^(PC_AGENT_MODE|PC_AGENT_AUTOSTART|WORKER_API_BASE_URL|WORKER_API_BASE_URL_MOCK|AUTH_MODE|PROXY_SECRET|AGENT_TOKEN)=' "$ENV_FILE" > "$TMP_ENV"
cat >> "$TMP_ENV" <<EOF
PC_AGENT_MODE=mock
PC_AGENT_AUTOSTART=false
WORKER_API_BASE_URL_MOCK=${WORKER_CONTAINER_URL}
WORKER_API_BASE_URL=${WORKER_CONTAINER_URL}
AUTH_MODE=firebase
PROXY_SECRET=${E2E_PROXY_SECRET}
AGENT_TOKEN=${E2E_AGENT_TOKEN}
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
  cp "$DEV_VARS" "$DEV_VARS_BAK"
  DEV_VARS_EXISTED=1
fi

restore_dev_vars() {
  if [ "$DEV_VARS_EXISTED" = "1" ]; then
    cp "$DEV_VARS_BAK" "$DEV_VARS"
  else
    rm -f "$DEV_VARS"
  fi
}

WORKER_PID=""
cleanup() {
  echo "Stopping Worker dev server (PID: ${WORKER_PID:-none})..."
  if [ -n "${WORKER_PID:-}" ]; then
    kill "$WORKER_PID" 2>/dev/null || true
  fi

  echo "Cleaning up Docker Compose project $COMPOSE_PROJECT_NAME..."
  docker compose \
    -p "$COMPOSE_PROJECT_NAME" \
    --env-file "$TMP_ENV" \
    -f "$COMPOSE_FILE" \
    -f "$TMP_COMPOSE_OVERRIDE" \
    down --remove-orphans >/dev/null 2>&1 || true

  rm -f "$TMP_WRANGLER"
  restore_dev_vars
}
trap cleanup EXIT INT TERM

echo "4. Creating host directories..."

read_env_value() {
  local key="$1"
  local file="$2"
  grep -E "^${key}=" "$file" | tail -n 1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}
HDD_BASE_VALUE="$(read_env_value HDD_BASE "$TMP_ENV")"
if [ -z "$HDD_BASE_VALUE" ]; then
  echo "❌ Error: HDD_BASE is not set in $TMP_ENV"
  exit 1
fi
for d in uploads outputs logs work cache tmp; do
  path="$HDD_BASE_VALUE/data/$d"
  mkdir -p "$path" 2>/dev/null || true
done

WRANGLER_PERSIST_DIR="$TMP_DIR/wrangler-state"
mkdir -p "$WRANGLER_PERSIST_DIR"

echo "4.5. Applying D1 local schema..."
D1_SCHEMA_FILE="$V2_DIR/worker/schema.sql"
(
  cd "$V2_DIR/worker"
  npx wrangler d1 execute pdf2zh-db \
    --local \
    --persist-to "$WRANGLER_PERSIST_DIR" \
    --file "$D1_SCHEMA_FILE" \
    -c wrangler.e2e.toml > "$TMP_DIR/worker-d1-schema.log" 2>&1 || true
)

echo "5. Starting Worker dev server in background..."
cat > "$DEV_VARS" <<EOF
AUTH_MODE="firebase"
FIREBASE_PROJECT_ID="${FIREBASE_PROJECT_ID}"
PRIVATE_API_BASE_URL="${PC_API_HOST_URL}"
PROXY_SECRET="${E2E_PROXY_SECRET}"
AGENT_TOKEN="${E2E_AGENT_TOKEN}"
EOF

: > "$WORKER_LOG"
(
  cd "$V2_DIR/worker"
  npx wrangler dev -c wrangler.e2e.toml --ip 0.0.0.0 --port "$WORKER_PORT" --persist-to "$WRANGLER_PERSIST_DIR" > "$WORKER_LOG" 2>&1
) &
WORKER_PID="$!"

echo "6. Waiting for Worker /healthz (up to 30s)..."
for i in $(seq 1 30); do
  if ! kill -0 "$WORKER_PID" 2>/dev/null; then
    echo "❌ Worker dev process exited before readiness."
    cat "$WORKER_LOG" | sed -E -e 's/(PROXY_SECRET: ")[^"]+/\1(hidden)/g' -e 's/(AGENT_TOKEN: ")[^"]+/\1(hidden)/g' || true
    exit 1
  fi

  status="$(curl -sS \
    -o "$TMP_DIR/worker-health.txt" \
    -w "%{http_code}" \
    "${WORKER_HOST_URL}/healthz" 2>"$TMP_DIR/worker-health.err" || true)"

  if [ "$status" = "200" ]; then
    echo "✅ Worker dev is ready: $WORKER_HOST_URL"
    break
  fi

  sleep 1
done

if [ "${status:-}" != "200" ]; then
  echo "❌ Worker dev did not become ready."
  cat "$TMP_DIR/worker-health.err" || true
  cat "$WORKER_LOG" | sed -E -e 's/(PROXY_SECRET: ")[^"]+/\1(hidden)/g' -e 's/(AGENT_TOKEN: ")[^"]+/\1(hidden)/g' || true
  exit 1
fi

echo "7. Starting pc-api container..."
docker compose \
  -p "$COMPOSE_PROJECT_NAME" \
  --env-file "$TMP_ENV" \
  -f "$COMPOSE_FILE" \
  -f "$TMP_COMPOSE_OVERRIDE" \
  up -d --build --force-recreate pc-api

echo "8. Checking reachability to pc-api locally..."
READY=false
for i in $(seq 1 30); do
  status="$(curl -sS -H "X-Proxy-Secret: ${E2E_PROXY_SECRET}" -o "$TMP_DIR/pc-api-health-body.txt" -w "%{http_code}" \
    "${PC_API_HOST_URL}/internal/healthz" 2>"$TMP_DIR/pc-api-health.err" || true)"

  if [ "$status" = "200" ]; then
    echo "✅ pc-api is ready: ${PC_API_HOST_URL}"
    READY=true
    break
  elif [ "$status" = "403" ]; then
    echo "Waiting for pc-api... attempt=$i status=403 (pc-api is reachable, but X-Proxy-Secret is missing or invalid)"
  else
    echo "Waiting for pc-api... attempt=$i status=${status:-curl_failed}"
  fi
  sleep 1
done

if [ "$READY" = false ]; then
  echo "❌ Error: pc-api health check failed."
  cat "$TMP_DIR/pc-api-health.err" || true
  docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$TMP_ENV" -f "$COMPOSE_FILE" -f "$TMP_COMPOSE_OVERRIDE" logs --tail=200 pc-api || true
  exit 1
fi

echo "=== Real Firebase Auth Mode Tests ==="

echo "Test 1: No token POST /jobs -> 401"
STATUS="$(curl -sS -o /dev/null -w "%{http_code}" -X POST "${WORKER_HOST_URL}/jobs")"
if [ "$STATUS" != "401" ]; then echo "❌ Expected 401, got $STATUS"; exit 1; fi
echo "✅ Passed"

echo "Test 2: Broken token POST /jobs -> 401"
STATUS="$(curl -sS -o /dev/null -w "%{http_code}" -H "Authorization: Bearer broken-token" -X POST "${WORKER_HOST_URL}/jobs")"
if [ "$STATUS" != "401" ]; then echo "❌ Expected 401, got $STATUS"; exit 1; fi
echo "✅ Passed"

echo "Test 3: Valid Real ID token POST /jobs -> 200"
TEST_PDF="/tmp/test-smoke.pdf"
echo "%PDF-1.4 dummy" > "$TEST_PDF"
STATUS="$(curl -sS -o "$TMP_DIR/upload-response.json" -w "%{http_code}" -H "Authorization: Bearer $REAL_ID_TOKEN" -F "pdf=@$TEST_PDF" "${WORKER_HOST_URL}/jobs")"
if [ "$STATUS" != "200" ]; then echo "❌ Expected 200, got $STATUS"; cat "$TMP_DIR/upload-response.json"; exit 1; fi
JOB_ID="$(jq -r .id "$TMP_DIR/upload-response.json")"
echo "✅ Passed. Job ID: $JOB_ID"

echo "Test 4: Verify uid mapping in GET /jobs/:id"
STATUS="$(curl -sS -o "$TMP_DIR/job-get.json" -w "%{http_code}" -H "Authorization: Bearer $REAL_ID_TOKEN" "${WORKER_HOST_URL}/jobs/${JOB_ID}")"
if [ "$STATUS" != "200" ]; then echo "❌ Expected 200, got $STATUS"; exit 1; fi
USER_ID="$(jq -r .user_id "$TMP_DIR/job-get.json")"
if [ "$USER_ID" != "$REAL_LOCAL_ID" ]; then echo "❌ Expected $REAL_LOCAL_ID, got $USER_ID"; exit 1; fi
echo "✅ Passed (owner uid is Firebase uid)"

echo "=== Real Firebase Auth E2E Smoke Test Passed! ==="
