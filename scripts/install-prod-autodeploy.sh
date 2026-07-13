#!/bin/bash
set -euo pipefail

echo "Deploying Production Auto-deploy Environment..."

if ! command -v docker &> /dev/null; then
    echo "❌ docker not found"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ docker compose not found"
    exit 1
fi

IMAGE="ghcr.io/oligamiq/pdf2zh-web-translator/pc-api:latest"

echo "Checking GHCR access..."
if ! docker pull $IMAGE; then
    echo "⚠️ Failed to pull $IMAGE."
    echo "If the package is private, please authenticate first:"
    echo "  echo \$CRPAT | docker login ghcr.io -u USERNAME --password-stdin"
    exit 1
fi

echo "Backing up docker-compose.yml..."
cp docker-compose.yml docker-compose.yml.bak

echo "Creating docker-compose.autodeploy.yml override..."
cat << 'EOF' > docker-compose.autodeploy.yml
services:
  pc-api:
    image: ghcr.io/oligamiq/pdf2zh-web-translator/pc-api:latest
    labels:
      - "com.centurylinklabs.watchtower.enable=true"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/internal/healthz"]
      interval: 15s
      timeout: 5s
      retries: 4
      start_period: 30s

  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command:
      - --label-enable
      - --cleanup
      - --interval
      - "60"
    restart: unless-stopped
EOF

PREV_DIGEST=""
if docker compose ps -q pc-api &>/dev/null; then
  PREV_IMAGE=$(docker inspect --format='{{.Config.Image}}' $(docker compose ps -q pc-api))
  PREV_DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' $PREV_IMAGE 2>/dev/null || echo "")
fi

echo "Starting deployment..."
if ! docker compose -f docker-compose.yml -f docker-compose.autodeploy.yml up -d pc-api watchtower; then
    echo "❌ Deployment failed."
    rm -f docker-compose.autodeploy.yml
    docker compose up -d pc-api
    exit 1
fi

echo "Waiting for health check..."
CONTAINER_ID=$(docker compose -f docker-compose.yml -f docker-compose.autodeploy.yml ps -q pc-api)

HEALTHY=false
for i in {1..12}; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' $CONTAINER_ID 2>/dev/null || echo "unknown")
  if [ "$STATUS" == "healthy" ]; then
    HEALTHY=true
    break
  fi
  echo "Status: $STATUS. Waiting 5s..."
  sleep 5
done

if [ "$HEALTHY" = true ]; then
  sleep 2
  GIT_SHA=$(docker exec $CONTAINER_ID curl -s http://localhost:8080/internal/healthz | grep -o '"git_sha":"[^"]*"' | cut -d'"' -f4 || echo "")
  echo "✅ pc-api is healthy! git_sha: $GIT_SHA"
  echo "🎉 installation completed"
else
  echo "❌ pc-api failed to become healthy. Rolling back..."
  rm -f docker-compose.autodeploy.yml
  docker compose up -d pc-api
  if [ -n "$PREV_DIGEST" ]; then
    echo "Restored previous deployment."
  fi
  exit 1
fi
