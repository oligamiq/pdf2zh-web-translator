#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
V2_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$V2_DIR/.env"
COMPOSE_FILE="$V2_DIR/docker-compose.yml"

echo "=== Mock Preflight Check ==="

# 1. tools
for cmd in docker curl jq python3 npm; do
  if ! command -v $cmd &> /dev/null; then
    echo "❌ Error: $cmd command not found."
    exit 1
  fi
done

# 2. .env exist
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: .env file not found."
  exit 1
fi
source "$ENV_FILE"

# 3. HDD_BASE exist
if [ -z "$HDD_BASE" ] || [ ! -d "$HDD_BASE" ]; then
  echo "❌ Error: HDD_BASE directory ($HDD_BASE) does not exist."
  exit 1
fi

# 4. docker compose ready
if ! docker compose version &> /dev/null; then
  echo "❌ Error: docker compose is not working."
  exit 1
fi

# 5. pc-api can be built
echo "Checking pc-api build..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build pc-api >/dev/null 2>&1

# 6. ports not exposed
if grep -qE "^[[:space:]]+ports:" "$COMPOSE_FILE"; then
  echo "❌ Error: pc-api should NOT expose ports."
  exit 1
fi

# 7. start container momentarily for checks
echo "Starting pc-api container for checks..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d pc-api

# 8. pdf2zh_next is in container
if ! docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T pc-api sh -lc 'command -v pdf2zh_next > /dev/null'; then
  echo "❌ Error: pdf2zh_next command not found inside pc-api container."
  exit 1
fi

# 9. writable /data
if ! docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T pc-api sh -lc 'test -w /data'; then
  echo "❌ Error: /data is not writable inside pc-api container."
  exit 1
fi

# 10. variables passed
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T pc-api sh -lc 'test -n "$PDF2ZH_DEFAULT_BASE_URL"' || { echo "❌ Error: PDF2ZH_DEFAULT_BASE_URL not passed."; exit 1; }
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T pc-api sh -lc 'test -n "$PDF2ZH_DEFAULT_MODEL"' || { echo "❌ Error: PDF2ZH_DEFAULT_MODEL not passed."; exit 1; }
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T pc-api sh -lc 'test -n "$PDF2ZH_DEFAULT_API_KEY"' || { echo "❌ Error: PDF2ZH_DEFAULT_API_KEY not passed."; exit 1; }

echo "✅ All preflight checks passed!"
