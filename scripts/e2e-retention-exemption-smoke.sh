#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKER_DIR="$ROOT_DIR/worker"
RUN_ID="$(date +%Y%m%d-%H%M%S)-$$"
TMP_DIR="$ROOT_DIR/.tmp/e2e-retention-$RUN_ID"
STATE_DIR="$TMP_DIR/state"
CONFIG="$TMP_DIR/wrangler.toml"
LOG="$TMP_DIR/worker.log"
mkdir -p "$STATE_DIR"

WORKER_PORT="$(python3 - <<'PY'
import socket
s = socket.socket()
s.bind(('127.0.0.1', 0))
print(s.getsockname()[1])
s.close()
PY
)"
WORKER_URL="http://127.0.0.1:${WORKER_PORT}"
python3 - "$WORKER_DIR/wrangler.toml" "$CONFIG" "$WORKER_DIR/src/index.ts" <<'PYCONFIG'
from pathlib import Path
import sys
src, dst, entrypoint = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3]).resolve().as_posix()
lines = src.read_text().splitlines()
out = []
skipping_vpc = False
for line in lines:
    stripped = line.strip()
    if stripped.startswith('main ='):
        line = f'main = "{entrypoint}"'
        stripped = line.strip()
    if stripped == '[[vpc_services]]':
        skipping_vpc = True
        continue
    if skipping_vpc and stripped.startswith('['):
        skipping_vpc = False
    if not skipping_vpc:
        out.append(line)
text = '\n'.join(out) + '\n'
text = text.replace('AUTH_MODE = "firebase"', 'AUTH_MODE = "mock"')
text += '\nPDF_VIEW_TOKEN_SECRET = "e2e-pdf-view"\nPUBLIC_RATE_LIMIT_SALT = "e2e-rate-limit"\n'
dst.write_text(text)
PYCONFIG
WRANGLER="$ROOT_DIR/node_modules/.bin/wrangler"
(
  cd "$TMP_DIR"
  "$WRANGLER" d1 execute pdf2zh-db --local --persist-to "$STATE_DIR" --file "$WORKER_DIR/schema.sql" -c "$CONFIG" >/dev/null
  "$WRANGLER" d1 execute pdf2zh-db --local --persist-to "$STATE_DIR" -c "$CONFIG" --command "
    INSERT INTO jobs (id,user_id,original_filename,status,created_at,finished_at,download_expires_at,owner_type,retention_exempt)
    VALUES
      ('ordinary-old','mock-user-123','ordinary.pdf','completed',datetime('now','-8 days'),datetime('now','-8 days'),datetime('now','-1 day'),'firebase',0),
      ('admin-old','mock-retention-exempt','admin.pdf','completed',datetime('now','-8 days'),datetime('now','-8 days'),datetime('now','-1 day'),'firebase',0);
  " >/dev/null
)

WORKER_PID=''
cleanup() {
  if [ -n "$WORKER_PID" ]; then kill "$WORKER_PID" 2>/dev/null || true; fi
  pkill -TERM -f "wrangler.*${WORKER_PORT}" 2>/dev/null || true
  pkill -TERM -f "workerd.*${WORKER_PORT}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
(
  cd "$TMP_DIR"
  "$WRANGLER" dev -c "$CONFIG" --ip 127.0.0.1 --port "$WORKER_PORT" --persist-to "$STATE_DIR" > "$LOG" 2>&1
) &
WORKER_PID=$!

for _ in $(seq 1 30); do
  if curl -fsS "$WORKER_URL/healthz" >/dev/null 2>&1; then break; fi
  if ! kill -0 "$WORKER_PID" 2>/dev/null; then
    cat "$LOG" >&2
    exit 1
  fi
  sleep 1
done
curl -fsS "$WORKER_URL/healthz" >/dev/null

ordinary_limits="$(curl -fsS -H 'Authorization: Bearer mock-normal' "$WORKER_URL/limits")"
admin_limits="$(curl -fsS -H 'Authorization: Bearer mock-retention-exempt' "$WORKER_URL/limits")"
ordinary_jobs="$(curl -fsS -H 'Authorization: Bearer mock-normal' "$WORKER_URL/jobs")"
admin_jobs="$(curl -fsS -H 'Authorization: Bearer mock-retention-exempt' "$WORKER_URL/jobs")"
python3 - "$ordinary_limits" "$admin_limits" "$ordinary_jobs" "$admin_jobs" <<'PYCHECK'
import json, sys
ordinary_limits, admin_limits, ordinary_jobs, admin_jobs = map(json.loads, sys.argv[1:])
assert ordinary_limits['retention_days'] == 7, ordinary_limits
assert ordinary_limits['retention_exempt'] is False, ordinary_limits
assert admin_limits['retention_days'] is None, admin_limits
assert admin_limits['retention_exempt'] is True, admin_limits
assert ordinary_jobs == [], ordinary_jobs
assert [job['id'] for job in admin_jobs] == ['admin-old'], admin_jobs
assert admin_jobs[0]['view_token'], admin_jobs
PYCHECK

ordinary_status="$(curl -sS -o "$TMP_DIR/ordinary.txt" -w '%{http_code}' -H 'Authorization: Bearer mock-normal' "$WORKER_URL/jobs/ordinary-old/download?type=dual")"
[ "$ordinary_status" = '410' ] || {
  echo "ordinary expired download expected 410, got $ordinary_status" >&2
  exit 1
}

ordinary_detail="$(curl -fsS -H 'Authorization: Bearer mock-normal' "$WORKER_URL/jobs/ordinary-old")"
ordinary_view_token="$(python3 - "$ordinary_detail" <<'PYTOKEN'
import json, sys
print(json.loads(sys.argv[1])['view_token'])
PYTOKEN
)"
ordinary_signed_status="$(curl -sS -o /dev/null -w '%{http_code}' "$WORKER_URL/jobs/ordinary-old/files/bilingual.pdf?receipt=$ordinary_view_token")"
[ "$ordinary_signed_status" = '410' ] || { echo "ordinary signed PDF expected 410, got $ordinary_signed_status" >&2; exit 1; }

forged_exempt_token="$(python3 - <<'PYFORGE'
import hashlib, hmac
print(hmac.new(b'e2e-pdf-view', b'pdf-job-retention-exempt:v1:ordinary-old', hashlib.sha256).hexdigest())
PYFORGE
)"
forged_status="$(curl -sS -o /dev/null -w '%{http_code}' "$WORKER_URL/jobs/ordinary-old/files/bilingual.pdf?receipt=$forged_exempt_token")"
[ "$forged_status" = '401' ] || { echo "non-exempt row accepted exempt token: $forged_status" >&2; exit 1; }
row_json="$(cd "$TMP_DIR" && "$WRANGLER" d1 execute pdf2zh-db --local --persist-to "$STATE_DIR" -c "$CONFIG" --json --command "SELECT retention_exempt, download_expires_at FROM jobs WHERE id='admin-old';")"
python3 - "$row_json" <<'PYROW'
import json, sys
payload = json.loads(sys.argv[1])
rows = payload[0]['results'] if isinstance(payload, list) else payload['results']
assert len(rows) == 1, rows
assert rows[0]['retention_exempt'] == 1, rows
assert rows[0]['download_expires_at'] is None, rows
PYROW

echo 'Retention exemption E2E PASS'
