#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
V2_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$V2_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Missing .env file: $ENV_FILE"
  exit 1
fi
source "$ENV_FILE"

if [ -z "$AGENT_TOKEN" ]; then
  echo "❌ AGENT_TOKEN is not set in .env"
  exit 1
fi

if [ -z "$WORKER_API_BASE_URL" ]; then
  echo "❌ WORKER_API_BASE_URL is not set in .env"
  exit 1
fi

echo "=== VPC Smoke Test ==="
echo "Target: $WORKER_API_BASE_URL/admin/pc-api-health"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $AGENT_TOKEN" "$WORKER_API_BASE_URL/admin/pc-api-health")

if [ "$HTTP_STATUS" -ne 200 ]; then
  echo "❌ Failed to connect to pc-api via Worker VPC. HTTP Status: $HTTP_STATUS"
  
  # Fetch full body to help debugging
  BODY=$(curl -s -H "Authorization: Bearer $AGENT_TOKEN" "$WORKER_API_BASE_URL/admin/pc-api-health")
  echo "Response: $BODY"
  exit 1
fi

echo "✅ Success! HTTP Status: $HTTP_STATUS"
BODY=$(curl -s -H "Authorization: Bearer $AGENT_TOKEN" "$WORKER_API_BASE_URL/admin/pc-api-health")
echo "Response: $BODY"

echo "=== VPC Smoke Test Passed ==="
