#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
V2_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$V2_DIR/docker-compose.yml"
ENV_FILE="${ENV_FILE:-$V2_DIR/.env}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-}"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: .env file not found: $ENV_FILE"
  echo "Please run: cp $V2_DIR/.env.example $V2_DIR/.env"
  exit 1
fi

COMPOSE_ARGS=(--env-file "$ENV_FILE" -f "$COMPOSE_FILE")
if [ -n "${COMPOSE_OVERRIDE_FILE:-}" ]; then
  COMPOSE_ARGS+=("-f" "$COMPOSE_OVERRIDE_FILE")
fi
if [ -n "${COMPOSE_PROJECT_NAME:-}" ]; then
  COMPOSE_ARGS=(-p "$COMPOSE_PROJECT_NAME" "${COMPOSE_ARGS[@]}")
fi

echo "=== Smoke Testing pdf2zh_next in Container ==="

# コンテナが起動しているか確認
if ! docker compose "${COMPOSE_ARGS[@]}" ps | grep -q "pc-api.*Up"; then
  echo "❌ Error: pc-api container is not running. Start it first: docker compose --env-file \"$ENV_FILE\" -f \"$COMPOSE_FILE\" up -d"
  exit 1
fi

echo "1. Checking command accessibility..."
docker compose "${COMPOSE_ARGS[@]}" exec -T pc-api sh -lc 'command -v pdf2zh_next'
echo "✅ pdf2zh_next is installed."

echo "2. Checking --help output..."
if ! docker compose "${COMPOSE_ARGS[@]}" exec -T pc-api sh -lc 'pdf2zh_next --help >/dev/null'; then
  echo "❌ Error: pdf2zh_next --help failed."
  exit 1
fi
echo "✅ pdf2zh_next --help executed successfully."

echo "3. Checking environment variables (without printing values)..."
for var in PDF2ZH_DEFAULT_BASE_URL PDF2ZH_DEFAULT_MODEL PDF2ZH_DEFAULT_API_KEY; do
  if ! docker compose "${COMPOSE_ARGS[@]}" exec -T pc-api sh -lc "test -n \"\$$var\""; then
    echo "❌ Error: Variable $var is not set in the container."
    exit 1
  fi
done
echo "✅ API Key and configuration variables exist in the container."

echo "4. Checking write permissions in /data..."
docker compose "${COMPOSE_ARGS[@]}" exec -T pc-api sh -lc '
set -eu

for d in /data /data/uploads /data/outputs /data/logs /data/work; do
  if [ ! -d "$d" ]; then
    echo "❌ Missing directory: $d"
    exit 1
  fi

  if [ ! -w "$d" ]; then
    echo "❌ Not writable: $d"
    ls -ld "$d"
    id
    exit 1
  fi

  tmp="$d/.write-test-$$"
  if ! echo test > "$tmp"; then
    echo "❌ Cannot create file in: $d"
    ls -ld "$d"
    id
    exit 1
  fi
  rm -f "$tmp"
done

echo "✅ /data directories are writable."
'

echo "=== pdf2zh_next smoke test passed ==="
