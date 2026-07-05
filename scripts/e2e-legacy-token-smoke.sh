#!/bin/bash
set -e

echo "Starting Legacy Token Smoke Test..."
WORKER_URL=${WORKER_URL:-"http://localhost:8787"}

if ! curl -s "$WORKER_URL/healthz" > /dev/null; then
  echo "Error: Worker is not running at $WORKER_URL"
  exit 1
fi

echo "Setting up test jobs in D1..."

JOB_ID_LEGACY_VALID="smoke-legacy-valid-$(date +%s)"
(cd worker && npx wrangler d1 execute pdf2zh-db --local --command "INSERT INTO jobs (id, user_id, original_filename, status, owner_type, created_at, download_expires_at) VALUES ('$JOB_ID_LEGACY_VALID', 'test-user', 'test.pdf', 'completed', 'user', '2026-07-01T00:00:00.000Z', '2030-01-01T00:00:00.000Z');")

JOB_ID_LEGACY_INVALID="smoke-legacy-invalid-$(date +%s)"
(cd worker && npx wrangler d1 execute pdf2zh-db --local --command "INSERT INTO jobs (id, user_id, original_filename, status, owner_type, created_at, download_expires_at) VALUES ('$JOB_ID_LEGACY_INVALID', 'test-user', 'test.pdf', 'completed', 'user', '2026-07-07T00:00:00.000Z', '2030-01-01T00:00:00.000Z');")

JOB_ID_LEGACY_EXPIRED="smoke-legacy-expired-$(date +%s)"
(cd worker && npx wrangler d1 execute pdf2zh-db --local --command "INSERT INTO jobs (id, user_id, original_filename, status, owner_type, created_at, download_expires_at) VALUES ('$JOB_ID_LEGACY_EXPIRED', 'test-user', 'test.pdf', 'completed', 'user', '2026-07-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z');")

cat << 'PYEOF' > generate_tokens.py
import hashlib
import sys
import hmac

salt = 'salt'
secret = 'secret'

job_id = sys.argv[1]
exp = sys.argv[2]
token_type = sys.argv[3]

if token_type == 'legacy':
    print(hashlib.sha256((job_id + salt).encode('utf-8')).hexdigest())
elif token_type == 'new':
    message = f"pdf-job:v1:{job_id}:{exp}"
    print(hmac.new(secret.encode('utf-8'), message.encode('utf-8'), hashlib.sha256).hexdigest())

PYEOF

LEGACY_VALID_TOKEN=$(python3 generate_tokens.py "$JOB_ID_LEGACY_VALID" "2030-01-01T00:00:00.000Z" legacy)
LEGACY_INVALID_TOKEN=$(python3 generate_tokens.py "$JOB_ID_LEGACY_INVALID" "2030-01-01T00:00:00.000Z" legacy)
LEGACY_EXPIRED_TOKEN=$(python3 generate_tokens.py "$JOB_ID_LEGACY_EXPIRED" "2020-01-01T00:00:00.000Z" legacy)
NEW_VALID_TOKEN=$(python3 generate_tokens.py "$JOB_ID_LEGACY_VALID" "2030-01-01T00:00:00.000Z" new)

set +e

echo "Testing new token (Should pass auth)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL/jobs/$JOB_ID_LEGACY_VALID/files/translated.pdf?receipt=$NEW_VALID_TOKEN")
if [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ]; then
  echo "FAIL: New token returned $STATUS instead of passing auth"
  exit 1
fi
echo "PASS: New token auth passed (Status: $STATUS)"

echo "Testing legacy token for migration-pre job (Should pass auth)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL/jobs/$JOB_ID_LEGACY_VALID/files/translated.pdf?receipt=$LEGACY_VALID_TOKEN")
if [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ]; then
  echo "FAIL: Legacy token for valid job returned $STATUS"
  exit 1
fi
echo "PASS: Legacy token auth passed (Status: $STATUS)"

echo "Testing legacy token for migration-post job (Should be 401)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL/jobs/$JOB_ID_LEGACY_INVALID/files/translated.pdf?receipt=$LEGACY_INVALID_TOKEN")
if [ "$STATUS" != "401" ]; then
  echo "FAIL: Legacy token for invalid job returned $STATUS instead of 401"
  exit 1
fi
echo "PASS: Legacy token rejected for post-migration job"

echo "Testing legacy token for expired job (Should be 410)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL/jobs/$JOB_ID_LEGACY_EXPIRED/files/translated.pdf?receipt=$LEGACY_EXPIRED_TOKEN")
if [ "$STATUS" != "410" ]; then
  echo "FAIL: Legacy token for expired job returned $STATUS instead of 410"
  exit 1
fi
echo "PASS: Legacy token returned 410 for expired job"

echo "Testing invalid token (Should be 401)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL/jobs/$JOB_ID_LEGACY_VALID/files/translated.pdf?receipt=invalid_token")
if [ "$STATUS" != "401" ]; then
  echo "FAIL: Invalid token returned $STATUS instead of 401"
  exit 1
fi
echo "PASS: Invalid token rejected"

echo "Testing HTML fallback (Should be application/json)"
CT=$(curl -s -I "$WORKER_URL/jobs/$JOB_ID_LEGACY_VALID/files/translated.pdf?receipt=invalid_token" | grep -i content-type | awk '{print $2}' | tr -d '\r')
if [[ "$CT" == *"text/html"* ]]; then
  echo "FAIL: Returned HTML fallback"
  exit 1
fi
echo "PASS: No HTML fallback"

echo "All tests passed successfully!"
