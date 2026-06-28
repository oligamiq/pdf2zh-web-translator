# pdf2zh-web v2 Frontend

This is the frontend application for the pdf2zh-web service, built with SolidJS and Vite.

## Modes

The application supports two primary usage modes:

1. **Logged-in Mode (Firebase Auth)**:
   - Requires Google login via Firebase.
   - Users can upload files (up to the worker's limit, typically no hard limit).
   - Users can securely store their own LLM API keys in Settings.
   - Job history is saved and accessible across devices.

2. **Public / Guest Mode**:
   - No login required.
   - Users can upload files up to 5MiB.
   - Protected by Cloudflare Turnstile against bots.
   - Rate limited per IP (3/day) and Client ID (1/day).
   - Users can optionally provide a one-time API key for the job (not saved).
   - If no API key is provided, the system falls back to a free/shared LLM (if configured).
     - **Note**: APIキーなしの public fallback を利用するには、バックエンドの Worker 側で `PUBLIC_FALLBACK_LLM_ENABLED="true"` および関連する設定 (SOURCE, BASE_URL, MODEL, SECRET) が完了している必要があります。未設定の場合はエラーとなります。

## Environment Variables

Copy `.env.example` to `.env.local` (for development) or `.env.production.local` (for production build) and fill in the values:

```env
VITE_API_BASE_URL=http://localhost:8787
VITE_TURNSTILE_SITE_KEY=...

# Firebase (Required for Logged-in mode)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

## Available Scripts

### `npm run dev`

Runs the app in the development mode.
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

### `npm run build`

Builds the app for production to the `dist` folder.
It correctly bundles Solid in production mode and optimizes the build for the best performance.

### `npm run test:e2e`

Runs Playwright E2E tests. Make sure you install playwright dependencies first (`npm exec --workspace frontend -- playwright install --with-deps`).

## Deployment

To deploy from the root of the project:

```bash
cd /srv/pdf2zh-web/v2
npm run deploy:frontend
```
