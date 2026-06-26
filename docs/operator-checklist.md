# Operator Checklist

本番環境（Cloudflare / Firebase / PC Host）構築時に設定すべき値のチェックリストです。

## Firebase

**取得方法**: Firebase Console > Project settings > General > Your apps (Web)
* [ ] `VITE_FIREBASE_API_KEY`: 
* [ ] `VITE_FIREBASE_AUTH_DOMAIN`: `<project-id>.firebaseapp.com`
* [ ] `VITE_FIREBASE_PROJECT_ID`: `<project-id>`
* [ ] `VITE_FIREBASE_APP_ID`: 

**設定作業**:
* [ ] Firebase Authentication (Google Sign-in) の有効化
* [ ] **Authorized domains** (Authentication > Settings > Authorized domains) に `your-frontend-app.pages.dev` (Cloudflare Pages URL) を追加する。

## Cloudflare Worker

**取得・生成方法**:
- `FIREBASE_PROJECT_ID`: Firebase Console から取得
- `PROXY_SECRET`, `AGENT_TOKEN`: 以下のコマンド等で生成
  ```bash
  openssl rand -base64 48
  ```

**`wrangler.toml` (vars / bindings)**:
* [ ] `FIREBASE_PROJECT_ID`: `<project-id>`
* [ ] `CORS_ORIGIN`: `https://your-frontend-app.pages.dev`
* [ ] `AUTH_MODE`: `"firebase"`
* [ ] `database_id` (D1): `wrangler d1 create` 時の UUID
* [ ] Cloudflare Tunnel が作成済みであること（Zero Trust Published appなし、Public hostnameなし）
* [ ] Workers VPC Service `pdf2zh-pc-api` が作成済みであること（`npx wrangler vpc service create --hostname pc-api --http-port 8080 ...`）
* [ ] Workers VPC service binding `PC_API_VPC` に `service_id` が設定されていること

**`wrangler secret put` (秘密値)**:
* [ ] `PROXY_SECRET`: (48文字以上のランダム文字列)
* [ ] `AGENT_TOKEN`: (48文字以上のランダム文字列)
* [ ] `USER_SETTINGS_SECRET`: (32バイト以上のランダム文字列をbase64エンコードしたもの)
* [ ] `TURNSTILE_SECRET_KEY`: (Cloudflare Turnstile Secret Key)
* [ ] `PUBLIC_RATE_LIMIT_SALT`: (ランダムなシークレット文字列)
* [ ] `PUBLIC_FALLBACK_LLM_API_KEY`: (Public mode用フォールバックOllama等のAPIキー)

**`wrangler.toml` (vars)**:
* [ ] `PUBLIC_FALLBACK_LLM_ENABLED`: `"true"` または `"false"` (APIキーなし public fallbackを有効にする場合は `"true"`)
* [ ] `PUBLIC_FALLBACK_LLM_SOURCE`: `"openaicompatible"` (ENABLED="true"のとき必須)
* [ ] `PUBLIC_FALLBACK_LLM_BASE_URL`: `https://your-public-llm-url` (ENABLED="true"のとき必須)
* [ ] `PUBLIC_FALLBACK_LLM_MODEL`: `your-public-llm-model` (ENABLED="true"のとき必須)

## Cloudflare Pages (Frontend)

**設定箇所**: `v2/frontend/.env.production.local`
* [ ] `VITE_API_BASE_URL`: `https://your-worker-app.workers.dev`
* [ ] `VITE_FIREBASE_API_KEY`: (Firebaseから取得)
* [ ] `VITE_FIREBASE_AUTH_DOMAIN`: (Firebaseから取得)
* [ ] `VITE_FIREBASE_PROJECT_ID`: (Firebaseから取得)
* [ ] `VITE_FIREBASE_STORAGE_BUCKET`: (Firebaseから取得)
* [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`: (Firebaseから取得)
* [ ] `VITE_FIREBASE_APP_ID`: (Firebaseから取得)
* [ ] `VITE_FIREBASE_MEASUREMENT_ID`: (Firebaseから取得)
* [ ] `VITE_TURNSTILE_SITE_KEY`: (Cloudflare Turnstile Site Key)

**デプロイ**:
* [ ] `npx wrangler pages deploy dist ...` でデプロイ完了していること

## PC Docker (Local Host)

**設定箇所**: `v2/.env`
* [ ] `HDD_BASE`: `/mnt/hdd/pdf2zh-web` など実在するパス
* [ ] `PROXY_SECRET`: (Workerのsecretと同じ値)
* [ ] `AGENT_TOKEN`: (Workerのsecretと同じ値)
* [ ] `WORKER_API_BASE_URL`: `https://your-worker-app.workers.dev`
* [ ] `PDF2ZH_DEFAULT_BASE_URL`: `https://ollama.com/v1` 等
* [ ] `PDF2ZH_DEFAULT_MODEL`: `gemma4:31b-cloud` 等
* [ ] `PDF2ZH_DEFAULT_API_KEY`: (Ollama等のAPIキー)
* [ ] `CLOUDFLARE_TUNNEL_TOKEN`: `cloudflared tunnel token <tunnel-name>` で取得したトークン（gitにはコミットしない）

## 最終チェック (Production Preflight)

すべての設定値や環境変数、ディレクトリを埋め終わったら、破壊的操作を伴わない以下のスクリプトで安全にチェックできます。
```bash
cd /srv/pdf2zh-web/v2
./scripts/preflight-prod.sh
```
> `=== Production Preflight Passed ===` が出れば準備完了です。

## Firebase Auth Mode テストについて

Firebase Auth環境の動作確認として2種類のE2Eテストが存在します。詳細は `docs/firebase-auth-test.md` を参照してください。
* **Local Firebase JWT E2E** (`scripts/e2e-firebase-local-smoke.sh`): CI向け。外部依存なくローカルでJWT検証と他人のジョブへのアクセス禁止を検証します。
* **Real Firebase Auth E2E** (`scripts/e2e-firebase-real-auth-smoke.sh`): 手元での本番前確認用。外部Firebaseと専用テストユーザー（本番ユーザー不可）を使用します。token/password/API keyはログ出力禁止です。
