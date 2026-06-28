# PDF翻訳 Web Translator

PDFをアップロードすると、翻訳済みPDFと対訳PDFを生成してダウンロードできるWebアプリです。

## Components

1. **Frontend (`v2/frontend`)**: SolidJS + Vite + TypeScript application deployed to Cloudflare Pages.
2. **Worker API (`v2/worker`)**: Cloudflare Worker acting as the public API Gateway, using D1 for state and Firebase Auth for verification.
3. **PC API & Agent (`v2/pc-api`)**: Private internal API running in Docker on the host machine. Polls the Worker for jobs and runs `pdf2zh`.

## Quick Start (Frontend)

1. Navigate to `v2/frontend`.
2. Copy `.env.example` to `.env` and fill in your Cloudflare Worker URL and Firebase credentials.
3. Install dependencies: `npm install`
4. Run development server: `npm run dev`

## Quick Start (Backend)

1. Navigate to `v2/worker`.
2. Configure `wrangler.toml` and run `npm install`.
3. Apply D1 schema: `wrangler d1 execute pdf2zh-db --local --file=./schema.sql` (or remote).
4. Run local worker: `npm run dev`

## Quick Start (PC Agent)

1. Build and run via `docker-compose up -d` in `v2/` directory.

## E2E Testing

The project provides two distinct E2E smoke tests with clear roles:
- `scripts/e2e-smoke.sh`: Fast mock E2E suitable for CI. It verifies API wiring, permissions, and database operations but does not wait for a full `pdf2zh_next` conversion.
- `scripts/e2e-real-conversion-smoke.sh`: Real conversion smoke suitable for pre-production or manual verification. It actually triggers `pdf2zh_next` and validates the resulting ZIP/PDF outputs. This test may take longer.

To run the mock smoke test:
```bash
cd v2
./scripts/e2e-smoke.sh
```

**E2E Testing Architecture & Constraints:**
- **Secret Isolation**: E2E does *not* depend on your production or local `.env` / `.dev.vars` secrets. The scripts generate temporary `PROXY_SECRET` and `AGENT_TOKEN` dynamically.
- **.dev.vars Handling**: The scripts temporarily swap out your `worker/.dev.vars` during the test and guarantee its restoration via a `trap` hook.
- **D1 State Isolation**: The test creates an isolated D1 state inside `.tmp/e2e-<timestamp>/wrangler-state` so past queued jobs do not interfere with tests.
- **Agent Loop**: The background agent loop in `pc-api` is intentionally paused (`PC_AGENT_AUTOSTART=false`) during mock smoke tests so the test script can assert API claim endpoints deterministically. It runs normally during real conversion tests.
- **No Cloudflared**: Cloudflared tunnels are not started in the mock E2E test; it communicates internally via loopback and Docker networking.

## Source code

https://github.com/oligamiq/pdf2zh-web-translator

## License

The original code in this repository is licensed under the MIT License.

This project uses third-party open-source software, including AGPL-3.0 components such as pdf2zh-next. Those components are licensed by their respective copyright holders and may impose additional obligations.

See THIRD_PARTY_NOTICES.md and the /licenses page for details.
