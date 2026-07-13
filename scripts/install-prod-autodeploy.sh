#!/bin/bash
set -euo pipefail

echo "Deploying Production Auto-deploy Environment..."

# 1. Environment Checks
if ! command -v docker &> /dev/null; then
    echo "❌ docker not found"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ docker compose not found"
    exit 1
fi

if [ ! -f docker-compose.yml ]; then
    echo "❌ docker-compose.yml not found in the current directory."
    exit 1
fi

# 2. GHCR Pull Check
IMAGE="ghcr.io/oligamiq/pdf2zh-web-translator/pc-api:stable"
echo "Checking GHCR access..."
if ! docker pull $IMAGE; then
    echo "⚠️ Failed to pull $IMAGE."
    echo "If the package is private, please authenticate first:"
    echo "  echo \$CRPAT | docker login ghcr.io -u USERNAME --password-stdin"
    exit 1
fi

# 3. Backup Configuration
echo "Backing up docker-compose.yml..."
cp docker-compose.yml docker-compose.yml.bak

# Modify docker-compose.yml to remove 'build:' for pc-api
sed -i '/build:/,/context: \.\/pc-api-python/d' docker-compose.yml

# 4. Generate Override
echo "Creating docker-compose.autodeploy.yml override..."
cat << 'EOF' > docker-compose.autodeploy.yml
services:
  pc-api:
    image: ghcr.io/oligamiq/pdf2zh-web-translator/pc-api:production
    labels:
      - "com.centurylinklabs.watchtower.enable=true"

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

# 5. Validate Effective Configuration
echo "Validating effective Compose configuration..."
docker compose -f docker-compose.yml -f docker-compose.autodeploy.yml config > /tmp/pdftr-compose-effective.yml

if grep -q "build:" /tmp/pdftr-compose-effective.yml; then
    echo "❌ Error: 'build:' instruction is still present in the effective configuration."
    mv docker-compose.yml.bak docker-compose.yml
    rm -f docker-compose.autodeploy.yml
    exit 1
fi

if ! grep -q "image: ghcr.io/oligamiq/pdf2zh-web-translator/pc-api:production" /tmp/pdftr-compose-effective.yml; then
    echo "❌ Error: GHCR image is not set for pc-api in effective configuration."
    mv docker-compose.yml.bak docker-compose.yml
    rm -f docker-compose.autodeploy.yml
    exit 1
fi

# 6. Capture Previous State for Rollback
PREV_DIGEST=""
if docker compose ps -q pc-api &>/dev/null; then
  PREV_IMAGE=$(docker inspect --format='{{.Config.Image}}' $(docker compose ps -q pc-api))
  PREV_DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' $PREV_IMAGE 2>/dev/null || echo "")
fi

# Initialize production tag with stable to safely start
docker tag ghcr.io/oligamiq/pdf2zh-web-translator/pc-api:stable ghcr.io/oligamiq/pdf2zh-web-translator/pc-api:production

# 7. Start Deployment
echo "Starting deployment..."
if ! docker compose -f docker-compose.yml -f docker-compose.autodeploy.yml up -d pc-api watchtower; then
    echo "❌ Deployment failed."
    rm -f docker-compose.autodeploy.yml
    mv docker-compose.yml.bak docker-compose.yml
    docker compose up -d pc-api
    exit 1
fi

# 8. Health Check Wait
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

# 9. Verify and Finalize
if [ "$HEALTHY" = true ]; then
  sleep 2
  GIT_SHA=$(docker exec $CONTAINER_ID curl -s http://localhost:8080/internal/healthz | grep -o '"git_sha":"[^"]*"' | cut -d'"' -f4 || echo "")
  echo "✅ pc-api is healthy! git_sha: $GIT_SHA"
  echo ""
  echo "installation completed"
  echo "automatic deployment enabled"
  echo "no further manual deployment is required"
else
  echo "❌ pc-api failed to become healthy. Rolling back..."
  rm -f docker-compose.autodeploy.yml
  mv docker-compose.yml.bak docker-compose.yml
  docker compose up -d pc-api
  if [ -n "$PREV_DIGEST" ]; then
    echo "Restored previous deployment."
  fi
  exit 1
fi
