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
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
s.bind(("0.0.0.0", 0))
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
PDF2ZH_TRANSLATOR_SERVICE=openaicompatible
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
E2E_RUN_ID = "${RUN_ID}"
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

PID_DIR="$V2_DIR/.tmp"
mkdir -p "$PID_DIR"
PREV_PID_FILE="$PID_DIR/e2e-worker.pid"

if [ -f "$PREV_PID_FILE" ]; then
  old_pid="$(cat "$PREV_PID_FILE")"
  if kill -0 "$old_pid" 2>/dev/null; then
    echo "Killing stale E2E Worker PID: $old_pid"
    kill "$old_pid" || true
  fi
fi

WORKER_PID=""
cleanup() {
  echo "16. Stopping Worker dev server (PID: ${WORKER_PID:-none})..."
  if [ -n "${WORKER_PID:-}" ]; then
    kill "$WORKER_PID" 2>/dev/null || true
  fi
  rm -f "$PREV_PID_FILE"

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

: > "$WORKER_LOG"

(
  cd "$V2_DIR/worker"
  npm install > "$TMP_DIR/worker-npm-install.log" 2>&1
  npx wrangler dev -c wrangler.e2e.toml --ip 0.0.0.0 --port "$WORKER_PORT" --persist-to "$WRANGLER_PERSIST_DIR" > "$WORKER_LOG" 2>&1
) &
WORKER_PID="$!"
echo "$WORKER_PID" > "$PREV_PID_FILE"

echo "5. Waiting for Worker /healthz (up to 30s)..."
READY=false
for i in $(seq 1 30); do
  if ! kill -0 "$WORKER_PID" 2>/dev/null; then
    echo "❌ Worker dev process died while waiting for /healthz"
    cat "$WORKER_LOG" | sed -E -e 's/(PROXY_SECRET: ")[^"]+/\1(hidden)/g' -e 's/(AGENT_TOKEN: ")[^"]+/\1(hidden)/g' || true
    exit 1
  fi

  if grep -qE 'Address already in use|The Workers runtime failed to start' "$WORKER_LOG" 2>/dev/null; then
    echo "❌ Worker dev failed to start."
    cat "$WORKER_LOG" | sed -E -e 's/(PROXY_SECRET: ")[^"]+/\1(hidden)/g' -e 's/(AGENT_TOKEN: ")[^"]+/\1(hidden)/g'
    exit 1
  fi

  status="$(curl -sS -o "$TMP_DIR/worker-health-body.txt" -w "%{http_code}" "${WORKER_HOST_URL}/healthz" || true)"
  
  RUN_ID_OK="0"
  if [ "$status" = "200" ]; then
    RUN_ID_OK="$(python3 - "$TMP_DIR/worker-health-body.txt" "$RUN_ID" <<'PY'
import json, sys
body, expected = sys.argv[1], sys.argv[2]
try:
    with open(body, "r", encoding="utf-8") as f:
        data = json.load(f)
    print("1" if data.get("run_id") == expected else "0")
except:
    print("0")
PY
)"
  fi

  if [ "$status" = "200" ] && [ "$RUN_ID_OK" = "1" ]; then
    echo "✅ Worker dev is ready: $WORKER_HOST_URL"
    echo "Worker bindings summary:"
    grep -A 8 -i "Vars:" "$WORKER_LOG" | sed -E -e 's/(PROXY_SECRET: ")[^"]+/\1(hidden)/g' -e 's/(AGENT_TOKEN: ")[^"]+/\1(hidden)/g' || true
    READY=true
    break
  fi

  sleep 1
done

if [ "$READY" = false ]; then
  echo "❌ Error: Worker failed to start within 30 seconds."
  echo "--- Worker Log (Tail 50) ---"
  tail -n 50 "$WORKER_LOG" | sed -E -e 's/(PROXY_SECRET: ")[^"]+/\1(hidden)/g' -e 's/(AGENT_TOKEN: ")[^"]+/\1(hidden)/g' || true
  exit 1
fi

echo "6. Starting pc-api container with mock configuration in project $COMPOSE_PROJECT_NAME..."
cd "$V2_DIR"
BUILD_LOG="$TMP_DIR/docker-build.log"

if ! docker compose \
  -p "$COMPOSE_PROJECT_NAME" \
  --env-file "$TMP_ENV" \
  -f "$COMPOSE_FILE" \
  -f "$TMP_COMPOSE_OVERRIDE" \
  up -d --build --force-recreate pc-api > "$BUILD_LOG" 2>&1; then
  echo "❌ docker compose build/up failed. Check $BUILD_LOG"
  cat "$BUILD_LOG"
  exit 1
fi

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

echo "9. Skipping smoke-pdf2zh-next.sh (doing real conversion)..."
echo "--- pdf2zh_next -h ---"
docker compose -p "$COMPOSE_PROJECT_NAME" --env-file "$TMP_ENV" -f "$COMPOSE_FILE" -f "$TMP_COMPOSE_OVERRIDE" exec -T pc-api sh -lc 'pdf2zh_next -h | tail -n 120' || true
echo "----------------------"

fetch_full_job_log() {
  local out="$TMP_DIR/job-log-full.txt"
  local offset=0
  local next=0
  local body="$TMP_DIR/job-log-page.json"

  : > "$out"

  while true; do
    curl -sS \
      -H "Authorization: Bearer $MOCK_TOKEN" \
      "${WORKER_HOST_URL}/jobs/${JOB_ID}/log?offset=${offset}&limit=65536" \
      -o "$body" || true

    python3 - "$body" "$out" <<'PY'
import json, sys
body, out = sys.argv[1], sys.argv[2]
try:
    with open(body, "r", encoding="utf-8") as f:
        data = json.load(f)
    chunk = data.get("data", "")
    if chunk:
        with open(out, "a", encoding="utf-8") as f:
            f.write(chunk)
except:
    pass
PY
    next="$(python3 - "$body" <<'PY'
import json, sys
try:
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        data = json.load(f)
    print(data.get("next_offset", 0))
except:
    print(0)
PY
)"

    if [ "$next" = "$offset" ] || [ "$next" = "0" ] || [ -z "$next" ]; then
      break
    fi

    offset="$next"
  done

  echo "--- Full Job Log ---"
  cat "$out" || true
}

print_debug_logs() {
  echo "--- Worker Log (Tail 160) ---"
  tail -n 160 "$WORKER_LOG" 2>/dev/null | sed -E -e 's/(PROXY_SECRET: ")[^"]+/\1(hidden)/g' -e 's/(AGENT_TOKEN: ")[^"]+/\1(hidden)/g' || true
  echo "--- pc-api Container Log (Tail 240) ---"
  docker compose \
    -p "$COMPOSE_PROJECT_NAME" \
    --env-file "$TMP_ENV" \
    -f "$COMPOSE_FILE" \
    -f "$TMP_COMPOSE_OVERRIDE" \
    logs --tail=240 pc-api || true
  
  if [ -n "${JOB_ID:-}" ]; then
    fetch_full_job_log
    
    echo "--- File System Check ---"
    find "$HDD_BASE_VALUE/data/outputs" -maxdepth 4 -type f -printf '%p %s\n' 2>/dev/null || true
    find "$HDD_BASE_VALUE/data/work" -maxdepth 4 -type f -printf '%p %s\n' 2>/dev/null || true
    find "$HDD_BASE_VALUE/data/uploads" -maxdepth 4 -type f -printf '%p %s\n' 2>/dev/null || true
    echo ""
  fi
}

echo "10. Uploading test PDF to /jobs..."
MOCK_TOKEN="mock-user-123"
TEST_PDF="$V2_DIR/fixtures/smoke-text.pdf"

if [ ! -f "$TEST_PDF" ]; then
  echo "❌ Missing fixture: $TEST_PDF"
  exit 1
fi

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

echo "12. Waiting for pc-api to process the job..."

REAL_CONVERSION_TIMEOUT_SECONDS="${REAL_CONVERSION_TIMEOUT_SECONDS:-300}"
POLL_INTERVAL_SECONDS="${POLL_INTERVAL_SECONDS:-5}"

JOB_BODY="$TMP_DIR/job-status.json"
JOB_HTTP_STATUS_FILE="$TMP_DIR/job-status.http"
JOB_LOG_BODY="$TMP_DIR/job-log.json"

DEADLINE=$((SECONDS + REAL_CONVERSION_TIMEOUT_SECONDS))
JOB_STATUS=""

while [ "$SECONDS" -lt "$DEADLINE" ]; do
  JOB_HTTP_STATUS="$(curl -sS \
    -o "$JOB_BODY" \
    -w "%{http_code}" \
    -H "Authorization: Bearer $MOCK_TOKEN" \
    "${WORKER_HOST_URL}/jobs/${JOB_ID}" || true)"

  echo "$JOB_HTTP_STATUS" > "$JOB_HTTP_STATUS_FILE"

  echo "Job status HTTP: $JOB_HTTP_STATUS"
  echo "Job body:"
  cat "$JOB_BODY" || true
  echo

  if [ "$JOB_HTTP_STATUS" -lt 200 ] || [ "$JOB_HTTP_STATUS" -ge 300 ]; then
    echo "❌ Failed to fetch job status."
    print_debug_logs
    exit 1
  fi

  JOB_STATUS="$(python3 - "$JOB_BODY" <<'PY'
import json, sys
try:
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        data = json.load(f)
    print(data.get("job", {}).get("status") or data.get("status") or "")
except:
    print("")
PY
)"

  echo "Current job status: $JOB_STATUS"

  case "$JOB_STATUS" in
    succeeded)
      echo "✅ Job succeeded."
      break
      ;;
    failed)
      echo "❌ Job failed."
      echo "Fetching job log..."
      curl -sS \
        -H "Authorization: Bearer $MOCK_TOKEN" \
        "${WORKER_HOST_URL}/jobs/${JOB_ID}/log?offset=0&limit=65536" \
        -o "$JOB_LOG_BODY" || true
      cat "$JOB_LOG_BODY" || true
      print_debug_logs
      exit 1
      ;;
    queued|running)
      sleep "$POLL_INTERVAL_SECONDS"
      ;;
    *)
      echo "❌ Unexpected job status: $JOB_STATUS"
      print_debug_logs
      exit 1
      ;;
  esac
done

if [ "$JOB_STATUS" != "succeeded" ]; then
  echo "❌ Timed out waiting for job to succeed after ${REAL_CONVERSION_TIMEOUT_SECONDS}s"
  curl -sS \
    -H "Authorization: Bearer $MOCK_TOKEN" \
    "${WORKER_HOST_URL}/jobs/${JOB_ID}/log?offset=0&limit=65536" \
    -o "$JOB_LOG_BODY" || true
  cat "$JOB_LOG_BODY" || true
  print_debug_logs
  exit 1
fi

echo "13. Checking log offset API..."
LOG_OUT=$(curl -sS -H "Authorization: Bearer $MOCK_TOKEN" "${WORKER_HOST_URL}/jobs/$JOB_ID/log?offset=0")
if [ -z "$LOG_OUT" ] || [ "$LOG_OUT" = "[]" ]; then
  echo "❌ Logs might be empty or unavailable."
fi
echo -e "\nLog check passed."

echo "14. Download API check (expect ZIP or success)..."

DOWNLOAD_ZIP="$TMP_DIR/download.zip"
DOWNLOAD_STATUS_FILE="$TMP_DIR/download-status.txt"

DOWNLOAD_STATUS="$(curl -sS \
  -o "$DOWNLOAD_ZIP" \
  -w "%{http_code}" \
  -H "Authorization: Bearer $MOCK_TOKEN" \
  "${WORKER_HOST_URL}/jobs/${JOB_ID}/download" || true)"

echo "$DOWNLOAD_STATUS" > "$DOWNLOAD_STATUS_FILE"
echo "Download status: $DOWNLOAD_STATUS"
echo "Download ZIP: $DOWNLOAD_ZIP"
echo "ZIP list: $TMP_DIR/download-zip-list.txt"

if [ "$DOWNLOAD_STATUS" != "200" ]; then
  echo "❌ Download failed with HTTP $DOWNLOAD_STATUS"
  print_debug_logs
  exit 1
fi

python3 - "$DOWNLOAD_ZIP" "$TMP_DIR/download-zip-list.txt" <<'PY'
import sys
import zipfile
from pathlib import Path

zip_path = Path(sys.argv[1])
list_path = Path(sys.argv[2])

if not zip_path.exists():
    raise SystemExit(f"download ZIP not found: {zip_path}")

if zip_path.stat().st_size <= 0:
    raise SystemExit(f"download ZIP is empty: {zip_path}")

with zipfile.ZipFile(zip_path) as z:
    bad = z.testzip()
    if bad:
        raise SystemExit(f"bad zip entry: {bad}")

    infos = z.infolist()
    lines = []
    lines.append("ZIP entries:")
    for info in infos:
        lines.append(f" - {info.filename} size={info.file_size} compressed={info.compress_size}")

    text = "\n".join(lines)
    print(text)
    list_path.write_text(text + "\n", encoding="utf-8")

    pdfs = [
        info for info in infos
        if not info.is_dir()
        and info.filename.lower().endswith(".pdf")
        and info.file_size > 0
    ]

    if not pdfs:
        raise SystemExit("no non-empty PDF in ZIP")

    print("PDF entries:")
    for info in pdfs:
        print(f" - {info.filename} size={info.file_size}")
PY

echo "Download API check passed."

echo "=== Real Conversion Smoke Test Passed! ==="
