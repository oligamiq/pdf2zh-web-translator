#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
V2_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$V2_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
fi

PC_API_URL=${PC_API_URL:-"http://localhost:8080"}
PROXY_SECRET=${PROXY_SECRET:-"mock_proxy_secret"}
TEST_JOB_ID="smoke-test-job-$(date +%s)"

echo "--- PC API Smoke Test ---"

echo "1. Testing /internal/healthz"
curl -sS -f -H "X-Proxy-Secret: $PROXY_SECRET" "$PC_API_URL/internal/healthz"
echo -e "\nOK\n"

echo "2. Putting test file"
# Create dummy file
echo "dummy pdf content" > /tmp/dummy.pdf
curl -sS -f -X PUT -H "X-Proxy-Secret: $PROXY_SECRET" --data-binary @/tmp/dummy.pdf "$PC_API_URL/internal/files/$TEST_JOB_ID/input"
echo -e "\nOK\n"

echo "3. Testing /internal/jobs/{id}/log"
RES=$(curl -sS -H "X-Proxy-Secret: $PROXY_SECRET" "$PC_API_URL/internal/jobs/$TEST_JOB_ID/log?offset=0")
echo "$RES" | grep '"next_offset":' >/dev/null
echo -e "OK\n"

echo "4. Deleting test job"
curl -sS -f -X POST -H "X-Proxy-Secret: $PROXY_SECRET" "$PC_API_URL/internal/files/$TEST_JOB_ID/delete"
echo -e "\nOK\n"

echo "PC API smoke test finished."
