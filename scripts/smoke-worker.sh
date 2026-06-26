#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
V2_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$V2_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
fi

WORKER_URL=${WORKER_URL:-"http://localhost:8787"}
AGENT_TOKEN=${AGENT_TOKEN:-"mock_agent_token"}

echo "--- Worker Smoke Test ---"

echo "1. Testing /healthz"
curl -sS -f "$WORKER_URL/healthz"
echo -e "\nOK\n"

echo "2. Agent heartbeat"
curl -sS -f -X POST -H "Authorization: Bearer $AGENT_TOKEN" "$WORKER_URL/agent/heartbeat"
echo -e "\nOK\n"

echo "3. Agent claim (expecting null or job id)"
RES=$(curl -sS -X POST -H "Authorization: Bearer $AGENT_TOKEN" -H "Content-Type: application/json" -d '{"worker_id":"smoke-test-worker"}' "$WORKER_URL/agent/claim")
echo "$RES"
echo -e "\nOK\n"

echo "Worker smoke test finished."
