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

PROD_COMPOSE_PROJECT_NAME="${PROD_COMPOSE_PROJECT_NAME:-${COMPOSE_PROJECT_NAME:-v2}}"
COMPOSE_ARGS=(-p "$PROD_COMPOSE_PROJECT_NAME" -f "$V2_DIR/docker-compose.yml" -f "$V2_DIR/docker-compose.autodeploy.yml")

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

if docker info >/dev/null 2>&1; then
  RUNNING_SERVICES="$(docker compose "${COMPOSE_ARGS[@]}" ps --status running --services)"
  if ! echo "$RUNNING_SERVICES" | grep -qx "pc-api-port-forward"; then
    echo "❌ pc-api-port-forward is not running in Compose project '$PROD_COMPOSE_PROJECT_NAME'. Workers VPC expects pc-api:8080."
    echo "   Start only the missing sidecar with:"
    echo "   sudo docker compose -p $PROD_COMPOSE_PROJECT_NAME -f $V2_DIR/docker-compose.yml -f $V2_DIR/docker-compose.autodeploy.yml up -d --no-deps pc-api-port-forward"
    exit 1
  fi
  echo "✅ pc-api-port-forward is running in Compose project '$PROD_COMPOSE_PROJECT_NAME'."
else
  echo "⚠️ Docker runtime status cannot be inspected; continuing with the Worker VPC probe."
fi

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
