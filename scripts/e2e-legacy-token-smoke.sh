#!/bin/bash
set -e

echo "Starting Legacy Token Smoke Test..."
echo "This test runs against a LOCAL worker instance (localhost:8787) using a LOCAL D1 emulator database."
echo "Ensure 'npm --prefix worker run dev -- --port 8787' is running."

WORKER_URL="http://localhost:8787"

echo "Setting up test jobs in D1..."

JOB_ID_LEGACY_VALID="smoke-legacy-valid-$(date +%s)"
(cd worker && npx wrangler d1 execute pdf2zh-db --local --command "INSERT INTO jobs (id, user_id, original_filename, status, owner_type, created_at, download_expires_at) VALUES ('$JOB_ID_LEGACY_VALID', 'test-user', 'test.pdf', 'completed', 'user', '2026-07-01T00:00:00.000Z', '2030-01-01T00:00:00.000Z');")

JOB_ID_LEGACY_INVALID="smoke-legacy-invalid-$(date +%s)"
(cd worker && npx wrangler d1 execute pdf2zh-db --local --command "INSERT INTO jobs (id, user_id, original_filename, status, owner_type, created_at, download_expires_at) VALUES ('$JOB_ID_LEGACY_INVALID', 'test-user', 'test.pdf', 'completed', 'user', '2026-07-07T00:00:00.000Z', '2030-01-01T00:00:00.000Z');")

JOB_ID_LEGACY_EXPIRED="smoke-legacy-expired-$(date +%s)"
(cd worker && npx wrangler d1 execute pdf2zh-db --local --command "INSERT INTO jobs (id, user_id, original_filename, status, owner_type, created_at, download_expires_at) VALUES ('$JOB_ID_LEGACY_EXPIRED', 'test-user', 'test.pdf', 'completed', 'user', '2026-07-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z');")

JOB_ID_PUBLIC="smoke-public-$(date +%s)"
(cd worker && npx wrangler d1 execute pdf2zh-db --local --command "INSERT INTO jobs (id, user_id, owner_type, original_filename, status, created_at, download_expires_at, public_receipt_hash) VALUES ('$JOB_ID_PUBLIC', 'public-user', 'public', 'public.pdf', 'completed', '2026-07-01T00:00:00.000Z', '2030-01-01T00:00:00.000Z', 'dummy-hash');")

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

# For public job, legacy token is sha256(receipt + salt). 
# Let receipt be "test-receipt".
PUBLIC_RECEIPT="test-receipt"
PUBLIC_LEGACY_HASH=$(python3 -c "import hashlib; print(hashlib.sha256(('test-receiptsalt').encode('utf-8')).hexdigest())")

# Update the public job to have this hash
(cd worker && npx wrangler d1 execute pdf2zh-db --local --command "UPDATE jobs SET public_receipt_hash = '$PUBLIC_LEGACY_HASH' WHERE id = '$JOB_ID_PUBLIC';")

set +e

# Kill any existing wrangler dev process on port 8787
fuser -k 8787/tcp || true

echo "--- Test 1: LEGACY_PDF_TOKEN_COMPAT_UNTIL Unset ---"
echo "Removing LEGACY_PDF_TOKEN_COMPAT_UNTIL from .dev.vars..."
sed -i '/LEGACY_PDF_TOKEN_COMPAT_UNTIL/d' worker/.dev.vars
(cd worker && npx wrangler dev --port 8787 > ../wrangler1.log 2>&1 &)
echo "Waiting for wrangler to start..."
while ! curl -s "http://localhost:8787/healthz" > /dev/null; do sleep 1; done

echo "Testing legacy token when unset (Should be 401)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8787/jobs/$JOB_ID_LEGACY_VALID/files/translated.pdf?receipt=$LEGACY_VALID_TOKEN")
if [ "$STATUS" != "401" ]; then
  echo "FAIL: Unset compat until should reject token, got $STATUS"
  exit 1
fi
echo "PASS: Rejected legacy token when unset"

fuser -k 8787/tcp || true

echo "--- Test 2: LEGACY_PDF_TOKEN_COMPAT_UNTIL Set (Future) ---"
echo "LEGACY_PDF_TOKEN_COMPAT_UNTIL=2030-01-01T00:00:00.000Z" >> worker/.dev.vars
(cd worker && npx wrangler dev --port 8787 > ../wrangler2.log 2>&1 &)
echo "Waiting for wrangler to start..."
while ! curl -s "http://localhost:8787/healthz" > /dev/null; do sleep 1; done

echo "Testing new token (Should pass auth -> 500 from mock pc-api)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8787/jobs/$JOB_ID_LEGACY_VALID/files/translated.pdf?receipt=$NEW_VALID_TOKEN")
if [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ]; then
  echo "FAIL: New token returned $STATUS instead of passing auth"
  exit 1
fi
echo "PASS: New token auth passed (Status: $STATUS)"

echo "Testing legacy token for migration-pre job (Should pass auth -> 500)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8787/jobs/$JOB_ID_LEGACY_VALID/files/translated.pdf?receipt=$LEGACY_VALID_TOKEN")
if [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ]; then
  echo "FAIL: Legacy token for valid job returned $STATUS"
  exit 1
fi
echo "PASS: Legacy token auth passed (Status: $STATUS)"

echo "Testing legacy token for migration-post job (Should be 401)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8787/jobs/$JOB_ID_LEGACY_INVALID/files/translated.pdf?receipt=$LEGACY_INVALID_TOKEN")
if [ "$STATUS" != "401" ]; then
  echo "FAIL: Legacy token for invalid job returned $STATUS instead of 401"
  exit 1
fi
echo "PASS: Legacy token rejected for post-migration job"

echo "Testing legacy token for expired job (Should be 410)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8787/jobs/$JOB_ID_LEGACY_EXPIRED/files/translated.pdf?receipt=$LEGACY_EXPIRED_TOKEN")
if [ "$STATUS" != "410" ]; then
  echo "FAIL: Legacy token for expired job returned $STATUS instead of 410"
  exit 1
fi
echo "PASS: Legacy token returned 410 for expired job"

echo "Testing public receipt fallback with mismatched job ID (Should be 404 or 401)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8787/public/jobs/wrong-id-123/download?receipt=$PUBLIC_RECEIPT")
if [ "$STATUS" = "500" ]; then
  echo "FAIL: Mismatched public receipt passed auth!"
  exit 1
fi
echo "PASS: Mismatched public receipt rejected (Status: $STATUS)"

echo "--- Test 3: LEGACY_PDF_TOKEN_COMPAT_UNTIL Set (Past) ---"
fuser -k 8787/tcp || true
sed -i 's/LEGACY_PDF_TOKEN_COMPAT_UNTIL=2030-01-01T00:00:00.000Z/LEGACY_PDF_TOKEN_COMPAT_UNTIL=2025-01-01T00:00:00.000Z/' worker/.dev.vars
(cd worker && npx wrangler dev --port 8787 > ../wrangler3.log 2>&1 &)
echo "Waiting for wrangler to start..."
while ! curl -s "http://localhost:8787/healthz" > /dev/null; do sleep 1; done

echo "Testing legacy token when expired compat (Should be 401)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8787/jobs/$JOB_ID_LEGACY_VALID/files/translated.pdf?receipt=$LEGACY_VALID_TOKEN")
if [ "$STATUS" != "401" ]; then
  echo "FAIL: Expired compat until should reject token, got $STATUS"
  exit 1
fi
echo "PASS: Rejected legacy token when compat expired"

# Cleanup
fuser -k 8787/tcp || true
sed -i '/LEGACY_PDF_TOKEN_COMPAT_UNTIL/d' worker/.dev.vars

echo "All tests passed successfully!"
