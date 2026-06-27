# Production E2E Runbook

本番のCloudflare / Firebase 環境に実値を投入して E2E テストを行うための手順書です。
上から順番に実行してください。

## 1. Firebase project作成
Firebase Consoleで新しいプロジェクトを作成します。

## 2. Firebase Auth Google login有効化
Firebase Console > Authentication > Sign-in method で **Google** を有効にします。

## 3. Firebase frontend env取得
Firebase Console > Project settings > General > Your apps (Web) から設定情報を取得します。
* `apiKey` -> `VITE_FIREBASE_API_KEY`
* `authDomain` -> `VITE_FIREBASE_AUTH_DOMAIN`
* `projectId` -> `VITE_FIREBASE_PROJECT_ID`
* `appId` -> `VITE_FIREBASE_APP_ID`

## 4. Firebase Authorized domains設定
Firebase Console > Authentication > Settings > Authorized domains に、後ほどCloudflare Pagesで割り当てられるドメイン（例: `your-app.pages.dev`）を追加します。

## 5. Cloudflare D1作成
```bash
npx wrangler d1 create pdf2zh-prod
```
> 期待出力: `database_id` (UUID) が表示されます。これをメモしてください。

## 6. D1 migration remote適用
`v2/worker/wrangler.toml` に `database_id` をセットしてから実行します。
```bash
cd /srv/pdf2zh-web/v2
npm --prefix worker run migrate:remote
```
> 期待出力: `3 commands executed successfully.` 等の成功メッセージ。

## 7. Worker secrets投入
ランダム文字列を生成して投入します。
```bash
openssl rand -base64 48 | npx wrangler secret put PROXY_SECRET
openssl rand -base64 48 | npx wrangler secret put AGENT_TOKEN
openssl rand -base64 32 | npx wrangler secret put USER_SETTINGS_SECRET
openssl rand -base64 32 | npx wrangler secret put PUBLIC_RATE_LIMIT_SALT
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put PUBLIC_FALLBACK_LLM_API_KEY
```
> 期待出力: `Successfully created secret for key PROXY_SECRET/AGENT_TOKEN` 等

## 8. Worker deploy
`v2/worker/wrangler.toml` の `AUTH_MODE="firebase"` および `FIREBASE_PROJECT_ID` 等が正しく設定されているか確認し、デプロイします。
また、APIキーなしの Public Fallback を利用する場合は `PUBLIC_FALLBACK_LLM_ENABLED="true"` に設定し、`SOURCE`, `BASE_URL`, `MODEL` を記述してください。
```bash
cd /srv/pdf2zh-web/v2
npm run deploy:worker
```
> 期待出力: デプロイ先のWorker URL（`https://your-worker.workers.dev`）が表示されます。

## 9. Workers VPC service / cloudflared tunnel設定
Cloudflare Dashboard (Workers VPC) からTunnelを作成し、PC APIを本番向けに非公開接続します。

1. Cloudflare Dashboard -> Networks -> Tunnels (または Workers VPC) から Tunnel を新規作成します。
   *(注意: Zero Trust の Published application や Public hostname は作成しません)*
2. 表示されたインストールコマンドから トークン のみを抽出し、Host PCの `.env` に設定します。（`CLOUDFLARE_TUNNEL_TOKEN="<token>"`）
3. トンネル作成後、`TUNNEL_ID` (UUID) をメモします。
4. Host PC にて `docker compose up -d --build pc-api cloudflared` を実行します。
5. Worker 用の VPC Service を作成します:
```bash
npx wrangler vpc service create pdf2zh-pc-api \
  --type http \
  --tunnel-id "<TUNNEL_ID>" \
  --hostname pc-api \
  --http-port 8080
```
6. コマンド結果から得られた `SERVICE_ID` を、`v2/worker/wrangler.toml` の `[[vpc_services]]` に設定し、再度 Worker をデプロイします。
7. デプロイ後、`./scripts/prod-vpc-smoke.sh` を実行して VPC 経由での pc-api 疎通確認を行います。

## 10. PC側 `.env` 作成
`v2/.env` を作成または編集し、以下の実値をセットします。
```env
WORKER_API_BASE_URL=(手順8のWorker URL)
HDD_BASE=/mnt/hdd/pdf2zh-web
PROXY_SECRET=(手順7でセットした値)
AGENT_TOKEN=(手順7でセットした値)
PDF2ZH_DEFAULT_BASE_URL=https://ollama.com/v1
PDF2ZH_DEFAULT_MODEL=gemma4:31b-cloud
PDF2ZH_DEFAULT_API_KEY=(Ollama互換等のAPIキー)
CLOUDFLARE_TUNNEL_TOKEN=(手順9のトンネルトークン)
```

## 11. HDDディレクトリ作成
PCのホスト側でデータディレクトリを作成します。
```bash
mkdir -p /mnt/hdd/pdf2zh-web/data/uploads
mkdir -p /mnt/hdd/pdf2zh-web/data/outputs
mkdir -p /mnt/hdd/pdf2zh-web/data/logs
mkdir -p /mnt/hdd/pdf2zh-web/data/work
mkdir -p /mnt/hdd/pdf2zh-web/data/cache
mkdir -p /mnt/hdd/pdf2zh-web/data/tmp
```

## 11.5. Production Preflight Check
全ての実値設定とディレクトリ作成が完了したら、デプロイや起動の前に設定漏れがないか確認します。
```bash
cd /srv/pdf2zh-web/v2
npm install
npm run verify
```
> 期待出力: `=== Production Preflight Passed ===` と E2E の成功メッセージ。

## 12. Docker compose build / up
```bash
cd v2
docker compose up -d --build
```
> 期待出力: コンテナが起動し、`docker compose logs -f` でAgent loopが動いている（通信エラーになっていない）ことが確認できる。

## 13. Frontend env設定
`v2/frontend/.env.production.local` を作成し、実値をセットします。
```env
VITE_API_BASE_URL=(手順8のWorker URL)
VITE_FIREBASE_API_KEY=(手順3の値)
VITE_FIREBASE_AUTH_DOMAIN=(Firebaseから取得)
VITE_FIREBASE_PROJECT_ID=(Firebaseから取得)
VITE_FIREBASE_STORAGE_BUCKET=(Firebaseから取得)
VITE_FIREBASE_MESSAGING_SENDER_ID=(Firebaseから取得)
VITE_FIREBASE_APP_ID=(Firebaseから取得)
VITE_FIREBASE_MEASUREMENT_ID=(Firebaseから取得)
VITE_TURNSTILE_SITE_KEY=(Cloudflare Turnstile Site Key)
```

## 14. Frontend deploy
`npm run deploy:frontend` または root の `npm run deploy` を用いてビルドとデプロイを行います。
```bash
cd /srv/pdf2zh-web/v2
npm run deploy:frontend
```
> 期待出力: 出力された Pages URL を控え、Firebase Console の Authorized domains に追加してください。

## 16. 本番E2Eテスト
Pages URLをブラウザで開いて、以下を確認してください。
1. Firebaseでログインできる
2. Settings画面でLLM設定を保存できる
3. API Key本体が再表示されない
4. PDFを1件アップロードできる
5. jobs一覧にqueued/running/succeededが出る
6. logが読める
7. 完了後にdownloadできる
8. ZIP内にPDFが入っている

**CUIベースでのテスト (Firebase Auth Mode E2E)**:
手元での本番前確認として、`scripts/e2e-firebase-real-auth-smoke.sh` を用いたE2Eテストが可能です。
- 専用のテストユーザーアカウント（本番ユーザーは不可）を用意してください。
- 実行時のtoken、パスワード、API keyは決してログに出力されない仕様になっています。
- このテストでは、Firebase Auth環境でのJWT検証と、他人のジョブへのアクセス（UID分離）が不可能であることが検証されます。
- 一方、CI向けには外部Firebase不要の `scripts/e2e-firebase-local-smoke.sh` を使用してください。

## 17. 失敗時の切り分け
* **ログインできない**: FirebaseのAuthorized domains設定、または `VITE_FIREBASE_*` 環境変数の誤り。
* **アップロード失敗 (500/502)**: PC APIとの VPC Service 接続が確立されていないか、PROXY_SECRETが一致していません。`prod-vpc-smoke.sh` で経路確認を行ってください。
* **ジョブがqueuedのまま**: PC側の `agentLoop` が落ちているか、`AGENT_TOKEN` が一致していません。`docker compose logs -f` を確認。

## 18. ロールバック手順
Worker側の障害時は、直前のデプロイバージョンへロールバックします。
```bash
cd v2/worker
npx wrangler deployments list
npx wrangler rollback <deployment-id>
```
Frontend側の障害時は、Cloudflare Pages のダッシュボードから過去のデプロイメントを選び、「Retry deployment」または「Rollback」を実行してください。

---
※ **ZIPダウンロードと期限について**:
現仕様ではフロントのボタンは「ZIPをダウンロード」であり、APIは `application/zip` を返します。完了から7日経過したものはD1上で期限判定が行われ、`410 Gone` が返ります。
HDD側のファイル実体のcleanupロジックは今回未実装のため、将来的にcron等による自動削除設定を行ってください。
