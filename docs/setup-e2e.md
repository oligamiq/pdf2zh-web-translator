# E2E Setup Guide

Follow these steps to configure the full V2 system (Frontend, Worker, PC Agent) for E2E testing.

## 1. Firebase Configuration
1. Go to Firebase Console and create a new project.
2. Enable Authentication (Google Sign-in).
3. Register a Web App and retrieve the Firebase config.
4. Update `v2/frontend/.env` with your Firebase API Key, Auth Domain, Project ID, and App ID.

## 2. Cloudflare D1 Setup
1. Run `wrangler d1 create pdf2zh-web`
2. Update `v2/worker/wrangler.toml` with the `database_id`.
3. Run `wrangler d1 execute pdf2zh-web --remote --file=./schema.sql` (or `--local` for dev).

## 3. Cloudflare Worker Deploy
1. Edit `v2/worker/wrangler.toml` to set `AUTH_MODE="firebase"` (for production) or `"mock"` (for E2E mock testing).
2. Set secrets using Wrangler:
   ```bash
   wrangler secret put PROXY_SECRET
   wrangler secret put AGENT_TOKEN
   ```
3. Run `npm run deploy` inside `v2/worker`.

## 4. Cloudflare Tunnel / VPC Binding
1. Configure Cloudflare Tunnel to route traffic to the local Docker PC API.
2. Link the Tunnel via `[[services]]` binding in `wrangler.toml` (e.g. `PDF2ZH_PRIVATE_API`).

## 5. PC Docker Agent Setup
1. Copy `v2/.env.example` to `v2/.env` and fill it in:
   - `HDD_BASE`
   - `PROXY_SECRET`
   - `AGENT_TOKEN`
   - `WORKER_API_BASE_URL`
   - `CLOUDFLARED_TUNNEL_TOKEN`
2. Start the services: `docker-compose up -d --build`

## 6. Frontend Deploy
1. Update `v2/frontend/.env` with `VITE_API_BASE_URL` pointing to your Worker URL.
2. Deploy to Cloudflare Pages:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Root directory: `v2/frontend`

## 7. E2E Verification
Run `v2/scripts/e2e-smoke.sh` to verify API integrations (ensure `AUTH_MODE=mock` is active if Firebase is not yet ready). Or open the deployed Cloudflare Pages URL and log in to test manually.
