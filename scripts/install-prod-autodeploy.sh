#!/bin/bash
set -euo pipefail

echo "Deploying Production Auto-deploy Environment..."

# Update docker-compose.yml
cat << 'EOF' > docker-compose.yml
services:
  pc-api:
    image: ghcr.io/oligamiq/pdf2zh-web-translator/pc-api:latest
    env_file:
      - .env
    environment:
      PC_AGENT_MODE: ${PC_AGENT_MODE:-mock}
      WORKER_API_BASE_URL: ${WORKER_API_BASE_URL}
      WORKER_API_BASE_URL_MOCK: ${WORKER_API_BASE_URL_MOCK:-http://host.docker.internal:8787}
      HDD_BASE: ${HDD_BASE}
      PROXY_SECRET: ${PROXY_SECRET}
      AGENT_TOKEN: ${AGENT_TOKEN}
      PDF2ZH_DEFAULT_BASE_URL: ${PDF2ZH_DEFAULT_BASE_URL}
      PDF2ZH_DEFAULT_MODEL: ${PDF2ZH_DEFAULT_MODEL}
      PDF2ZH_DEFAULT_API_KEY: ${PDF2ZH_DEFAULT_API_KEY}
      PDF2ZH_DEFAULT_REASONING_EFFORT: ${PDF2ZH_DEFAULT_REASONING_EFFORT:-high}
      PDF2ZH_DEFAULT_TIMEOUT: ${PDF2ZH_DEFAULT_TIMEOUT:-500}
      PDF2ZH_OPENAI_COMPATIBLE_BASE_URL: ${PDF2ZH_DEFAULT_BASE_URL}
      PDF2ZH_OPENAI_COMPATIBLE_MODEL: ${PDF2ZH_DEFAULT_MODEL}
      PDF2ZH_OPENAI_COMPATIBLE_API_KEY: ${PDF2ZH_DEFAULT_API_KEY}
      PDF2ZH_OPENAI_COMPATIBLE_TIMEOUT: ${PDF2ZH_DEFAULT_TIMEOUT:-500}
      PDF2ZH_OPENAI_COMPATIBLE_REASONING_EFFORT: ${PDF2ZH_DEFAULT_REASONING_EFFORT:-high}
    volumes:
      - ${HDD_BASE}/data:/data
    networks:
      - internal-net
    extra_hosts:
      - "host.docker.internal:host-gateway"
    ports:
      - "127.0.0.1:8789:8080"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/internal/healthz"]
      interval: 15s
      timeout: 5s
      retries: 4
      start_period: 30s

  cloudflared:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    depends_on:
      - pc-api
    command: tunnel --no-autoupdate run --token ${CLOUDFLARE_TUNNEL_TOKEN:?CLOUDFLARE_TUNNEL_TOKEN is required}
    networks:
      - internal-net

  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 60 pc-api
    restart: unless-stopped

networks:
  internal-net:
    driver: bridge
EOF

echo "Pulling latest image and starting..."
if ! docker compose pull; then
  echo "⚠️ Failed to pull image. If the GHCR package is private, please run:"
  echo "    echo \$CRPAT | docker login ghcr.io -u USERNAME --password-stdin"
  echo "and re-run this script."
  exit 1
fi

docker compose up -d

echo "Waiting for health check..."
CONTAINER_ID=$(docker compose ps -q pc-api)
if [ -z "$CONTAINER_ID" ]; then
  echo "❌ pc-api container not found."
  exit 1
fi

for i in {1..12}; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' $CONTAINER_ID 2>/dev/null || echo "unknown")
  if [ "$STATUS" == "healthy" ]; then
    echo "✅ pc-api is healthy!"
    break
  fi
  echo "Status: $STATUS. Waiting 5s..."
  sleep 5
done

echo "🎉 Auto-deploy environment installed successfully!"
