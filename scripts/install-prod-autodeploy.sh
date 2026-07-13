#!/bin/bash
set -euo pipefail

echo "Deploying Production Auto-deploy Environment..."

# 1. Environment Checks
if ! command -v docker &> /dev/null; then
    echo "❌ docker not found"
    exit 1
fi

if ! command -v shellcheck &> /dev/null; then
    echo "⚠️ shellcheck not found, skipping script self-check"
else
    shellcheck "$0"
fi

if ! docker compose version &> /dev/null; then
    echo "❌ docker compose not found"
    exit 1
fi

if [ ! -f docker-compose.yml ] || [ ! -f docker-compose.autodeploy.yml ]; then
    echo "❌ Required docker-compose files not found in the current directory."
    exit 1
fi

# 2. Validate Effective Configuration
echo "Validating effective Compose configuration..."
docker compose -f docker-compose.yml -f docker-compose.autodeploy.yml config > /tmp/pdftr-compose-effective.yml

if grep -q "build:" /tmp/pdftr-compose-effective.yml; then
    echo "❌ Error: 'build:' instruction is present in the effective configuration."
    exit 1
fi

if ! grep -q "image: ghcr.io/oligamiq/pdf2zh-web-translator/pc-api:production" /tmp/pdftr-compose-effective.yml; then
    echo "❌ Error: GHCR image is not set for pc-api in effective configuration."
    exit 1
fi

# 3. Pull Images
echo "Checking GHCR access and pulling images..."
if ! docker compose -f docker-compose.yml -f docker-compose.autodeploy.yml pull pc-api; then
    echo "⚠️ Failed to pull image."
    echo "If the package is private, please authenticate first:"
    echo "  echo \$CRPAT | docker login ghcr.io -u USERNAME --password-stdin"
    echo "Or ensure that GitHub Actions has successfully built and tagged the 'production' image."
    exit 1
fi

# 4. Capture Previous State for Rollback
PREV_DIGEST=""
if docker compose ps -q pc-api &>/dev/null; then
  PREV_IMAGE=$(docker inspect --format='{{.Config.Image}}' "$(docker compose ps -q pc-api)")
  PREV_DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' "$PREV_IMAGE" 2>/dev/null || echo "")
fi

# 5. Start Deployment
echo "Starting deployment..."
if ! docker compose -f docker-compose.yml -f docker-compose.autodeploy.yml up -d; then
    echo "❌ Deployment failed."
    if [ -n "$PREV_DIGEST" ]; then
        echo "Rolling back to previous digest ($PREV_DIGEST)..."
        cat << OVERRIDE > docker-compose.rollback.yml
services:
  pc-api:
    image: $PREV_DIGEST
OVERRIDE
        docker compose -f docker-compose.yml -f docker-compose.rollback.yml up -d pc-api
        rm -f docker-compose.rollback.yml
    fi
    exit 1
fi

# 6. Health Check Wait
echo "Waiting for health check..."
CONTAINER_ID=$(docker compose -f docker-compose.yml -f docker-compose.autodeploy.yml ps -q pc-api)

HEALTHY=false
for _ in {1..12}; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_ID" 2>/dev/null || echo "unknown")
  if [ "$STATUS" == "healthy" ]; then
    HEALTHY=true
    break
  fi
  echo "Status: $STATUS. Waiting 5s..."
  sleep 5
done

# 7. Verify and Finalize
if [ "$HEALTHY" = true ]; then
  sleep 2
  GIT_SHA=$(docker exec "$CONTAINER_ID" python -c "import json, urllib.request; print(json.load(urllib.request.urlopen('http://127.0.0.1:8081/internal/healthz', timeout=3)).get('git_sha', ''))" || echo "")
  echo "✅ pc-api is healthy! git_sha: $GIT_SHA"
  echo ""
  echo "installation completed"
  echo "automatic deployment enabled"
  echo "no further manual deployment is required"
else
  echo "❌ pc-api failed to become healthy. Rolling back..."
  if [ -n "$PREV_DIGEST" ]; then
      cat << OVERRIDE > docker-compose.rollback.yml
services:
  pc-api:
    image: $PREV_DIGEST
OVERRIDE
      docker compose -f docker-compose.yml -f docker-compose.rollback.yml up -d pc-api
      rm -f docker-compose.rollback.yml
      echo "Restored previous deployment."
  else
      # If no previous digest, we just stop the broken container
      docker compose -f docker-compose.yml -f docker-compose.autodeploy.yml stop pc-api
  fi
  exit 1
fi
