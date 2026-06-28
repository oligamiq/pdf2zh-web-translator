#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
V2_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$V2_DIR/.env"
COMPOSE_FILE="$V2_DIR/docker-compose.yml"

RUN_ID="$(date +%Y%m%d-%H%M%S)-$$"
TMP_DIR="$V2_DIR/.tmp/e2e-auth-download-$RUN_ID"
mkdir -p "$TMP_DIR"

export COMPOSE_PROJECT_NAME="pdf2zh-e2e-auth-download"

WORKER_PORT="$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()')"
PC_API_PORT="$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()')"
E2E_PROXY_SECRET="mock-proxy-secret"
E2E_AGENT_TOKEN="mock-agent-token"

WORKER_HOST_URL="http://localhost:${WORKER_PORT}"
WORKER_CONTAINER_URL="http://host.docker.internal:${WORKER_PORT}"
PC_API_HOST_URL="http://127.0.0.1:${PC_API_PORT}"

TMP_ENV="$TMP_DIR/env"
TMP_COMPOSE_OVERRIDE="$TMP_DIR/docker-compose.override.yml"
TMP_WRANGLER="$V2_DIR/worker/wrangler.e2e.toml"

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
if [ -f "$DEV_VARS" ]; then
  cp "$DEV_VARS" "$DEV_VARS_BAK"
fi
cat > "$DEV_VARS" <<EOF
AUTH_MODE=mock
EOF

echo "Starting environment..."
sudo docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$TMP_ENV" -f "$COMPOSE_FILE" -f "$TMP_COMPOSE_OVERRIDE" up -d
sleep 2
cd "$V2_DIR/worker" && npx wrangler d1 migrations apply DB --local --config "$TMP_WRANGLER"
npx wrangler dev --port "$WORKER_PORT" --config "$TMP_WRANGLER" > "$TMP_DIR/worker.log" 2>&1 &
WORKER_PID=$!
sleep 5

cleanup() {
  echo "Cleaning up..."
  kill $WORKER_PID || true
  sudo docker compose -p "$COMPOSE_PROJECT_NAME" down -v || true
  if [ -f "$DEV_VARS_BAK" ]; then
    cp "$DEV_VARS_BAK" "$DEV_VARS"
  else
    rm -f "$DEV_VARS"
  fi
}
trap cleanup EXIT

MOCK_TOKEN="mock-user-123"
TEST_PDF="/tmp/test-smoke.pdf"
echo "%PDF-1.4 dummy pdf" > "$TEST_PDF"

# 1. Create Private Job
echo "Uploading private job..."
UPLOAD_RES=$(curl -sS -w "\n%{http_code}" -X POST "${WORKER_HOST_URL}/jobs" -H "Authorization: Bearer $MOCK_TOKEN" -F "pdf=@${TEST_PDF};type=application/pdf")
STATUS=$(echo "$UPLOAD_RES" | tail -n1)
BODY=$(echo "$UPLOAD_RES" | sed '$d')
if [ "$STATUS" != "200" ]; then echo "Private job upload failed"; exit 1; fi
JOB_ID=$(python3 -c "import json; print(json.loads('''$BODY''').get('job', {}).get('id', ''))")

# 2. Test Private Job Download
echo "Testing Private Job Download..."
DL_STATUS_NO_AUTH=$(curl -s -o /dev/null -w "%{http_code}" "${WORKER_HOST_URL}/jobs/$JOB_ID/download?type=dual")
if [ "$DL_STATUS_NO_AUTH" != "401" ]; then echo "❌ Private download without auth expected 401, got $DL_STATUS_NO_AUTH"; exit 1; fi

curl -s -D "$TMP_DIR/headers.txt" -H "Authorization: Bearer $MOCK_TOKEN" "${WORKER_HOST_URL}/jobs/$JOB_ID/download?type=dual" -o "$TMP_DIR/downloaded.pdf"
DL_STATUS_AUTH=$(grep -i "^HTTP" "$TMP_DIR/headers.txt" | tail -1 | awk '{print $2}')
if [ "$DL_STATUS_AUTH" != "200" ]; then echo "❌ Private download with auth expected 200, got $DL_STATUS_AUTH"; exit 1; fi

DL_CTYPE=$(grep -i "^content-type:" "$TMP_DIR/headers.txt" | awk '{print $2}' | tr -d '\r')
if [ "$DL_CTYPE" != "application/pdf" ]; then echo "❌ Expected Content-Type application/pdf, got $DL_CTYPE"; exit 1; fi

DL_HEAD=$(head -c 5 "$TMP_DIR/downloaded.pdf")
if [ "$DL_HEAD" != "%PDF-" ]; then echo "❌ Expected body to start with %PDF-, got $DL_HEAD"; exit 1; fi
echo "✅ Private job download requires auth and returns valid PDF."

# 3. Create Public Job
echo "Uploading public job..."
PUB_RES=$(curl -sS -w "\n%{http_code}" -X POST "${WORKER_HOST_URL}/jobs" -F "pdf=@${TEST_PDF};type=application/pdf")
PUB_STATUS=$(echo "$PUB_RES" | tail -n1)
PUB_BODY=$(echo "$PUB_RES" | sed '$d')
if [ "$PUB_STATUS" != "200" ]; then echo "Public job upload failed"; exit 1; fi
PUB_JOB_ID=$(python3 -c "import json; print(json.loads('''$PUB_BODY''').get('id', ''))")
RECEIPT=$(python3 -c "import json; print(json.loads('''$PUB_BODY''').get('receipt', ''))")

# 4. Test Public Job Download
echo "Testing Public Job Download..."
PUB_DL_STATUS_NO_RECEIPT=$(curl -s -o /dev/null -w "%{http_code}" "${WORKER_HOST_URL}/public/jobs/$PUB_JOB_ID/download?type=dual")
if [ "$PUB_DL_STATUS_NO_RECEIPT" != "401" ] && [ "$PUB_DL_STATUS_NO_RECEIPT" != "403" ]; then echo "❌ Public download without receipt expected 401/403, got $PUB_DL_STATUS_NO_RECEIPT"; exit 1; fi

curl -s -D "$TMP_DIR/pub_headers.txt" "${WORKER_HOST_URL}/public/jobs/$PUB_JOB_ID/download?type=dual&receipt=$RECEIPT" -o "$TMP_DIR/pub_downloaded.pdf"
PUB_DL_STATUS_RECEIPT=$(grep -i "^HTTP" "$TMP_DIR/pub_headers.txt" | tail -1 | awk '{print $2}')
if [ "$PUB_DL_STATUS_RECEIPT" != "200" ]; then echo "❌ Public download with receipt expected 200, got $PUB_DL_STATUS_RECEIPT"; exit 1; fi

PUB_DL_CTYPE=$(grep -i "^content-type:" "$TMP_DIR/pub_headers.txt" | awk '{print $2}' | tr -d '\r')
if [ "$PUB_DL_CTYPE" != "application/pdf" ]; then echo "❌ Expected Content-Type application/pdf, got $PUB_DL_CTYPE"; exit 1; fi

PUB_DL_HEAD=$(head -c 5 "$TMP_DIR/pub_downloaded.pdf")
if [ "$PUB_DL_HEAD" != "%PDF-" ]; then echo "❌ Expected body to start with %PDF-, got $PUB_DL_HEAD"; exit 1; fi
echo "✅ Public job download succeeds with receipt and returns valid PDF."

# 5. Test ZIP Download
echo "Testing ZIP Download..."
curl -s -D "$TMP_DIR/zip_headers.txt" -H "Authorization: Bearer $MOCK_TOKEN" "${WORKER_HOST_URL}/jobs/$JOB_ID/download?type=zip" -o "$TMP_DIR/downloaded.zip"
ZIP_CTYPE=$(grep -i "^content-type:" "$TMP_DIR/zip_headers.txt" | awk '{print $2}' | tr -d '\r')
if [ "$ZIP_CTYPE" != "application/zip" ]; then echo "❌ Expected Content-Type application/zip, got $ZIP_CTYPE"; exit 1; fi
echo "✅ ZIP download successfully returns application/zip."

echo "=== All Tests Passed ==="
