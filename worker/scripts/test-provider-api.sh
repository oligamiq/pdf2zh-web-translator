#!/bin/bash
set -e

echo "Starting local worker for API tests..."
export AUTH_MODE="mock"

# Start wrangler in background
npx wrangler dev --remote --port 8788 --var AUTH_MODE:mock --var USER_SETTINGS_SECRET:MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI= > .wrangler_dev.log 2>&1 &
WRANGLER_PID=$!

function cleanup {
  echo "Killing wrangler (PID $WRANGLER_PID)..."
  kill $WRANGLER_PID
  wait $WRANGLER_PID 2>/dev/null || true
  rm -f .wrangler_dev.log
}
trap cleanup EXIT

# Wait for worker to be ready
echo "Waiting for worker to start..."
for i in {1..20}; do
  if curl -s http://127.0.0.1:8788/healthz >/dev/null; then
    echo "Worker is up!"
    break
  fi
  sleep 1
done

# We will test the API endpoints
echo "Testing POST /settings/api/providers"
# 1. valid provider -> 200 (returns ID)
POST_RESP=$(curl -s -X POST http://127.0.0.1:8788/settings/api/providers \
  -H "Authorization: Bearer mock-test-user" \
  -H "Content-Type: application/json" \
  -d '{"display_name": "Test Provider", "provider_type": "openai_compatible", "base_url": "http://test", "model": "test-model", "api_key": "test-key"}')

ID=$(echo $POST_RESP | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ -z "$ID" ]; then
  echo "Failed to create provider! Response: $POST_RESP"
  exit 1
fi
echo "Created provider ID: $ID"

echo "Testing PUT /settings/api/providers/:id"
# 2. valid update -> 200 (no deleted_at error)
PUT_RESP=$(curl -s -w "%{http_code}" -X PUT "http://127.0.0.1:8788/settings/api/providers/$ID" \
  -H "Authorization: Bearer mock-test-user" \
  -H "Content-Type: application/json" \
  -d '{"display_name": "Updated Provider"}')
STATUS_CODE=$(echo "$PUT_RESP" | tail -c 4 | xargs)
if [ "$STATUS_CODE" != "200" ]; then
  echo "Failed valid update! Response: $PUT_RESP"
  exit 1
fi
echo "Valid update passed!"

# 3. api_key omission -> 200
PUT_RESP=$(curl -s -w "%{http_code}" -X PUT "http://127.0.0.1:8788/settings/api/providers/$ID" \
  -H "Authorization: Bearer mock-test-user" \
  -H "Content-Type: application/json" \
  -d '{"display_name": "Updated Provider 2"}')
STATUS_CODE=$(echo "$PUT_RESP" | tail -c 4 | xargs)
if [ "$STATUS_CODE" != "200" ]; then
  echo "Failed valid update (missing api_key)! Response: $PUT_RESP"
  exit 1
fi
echo "Valid update (missing api_key) passed!"

# 4. model empty -> 400
PUT_RESP=$(curl -s -w "%{http_code}" -X PUT "http://127.0.0.1:8788/settings/api/providers/$ID" \
  -H "Authorization: Bearer mock-test-user" \
  -H "Content-Type: application/json" \
  -d '{"model": ""}')
STATUS_CODE=$(echo "$PUT_RESP" | tail -c 4 | xargs)
if [ "$STATUS_CODE" != "400" ]; then
  echo "Expected 400 for empty model! Response: $PUT_RESP"
  exit 1
fi
echo "Empty model rejected correctly!"

# 5. timeout_seconds invalid -> 400
PUT_RESP=$(curl -s -w "%{http_code}" -X PUT "http://127.0.0.1:8788/settings/api/providers/$ID" \
  -H "Authorization: Bearer mock-test-user" \
  -H "Content-Type: application/json" \
  -d '{"timeout_seconds": "invalid"}')
STATUS_CODE=$(echo "$PUT_RESP" | tail -c 4 | xargs)
if [ "$STATUS_CODE" != "400" ]; then
  echo "Expected 400 for invalid timeout! Response: $PUT_RESP"
  exit 1
fi
echo "Invalid timeout rejected correctly!"

echo "All tests passed!"
