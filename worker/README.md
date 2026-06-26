# pdf2zh-worker

This is the Cloudflare Worker API Gateway for the pdf2zh Web V2 system.

## Local Development

You can run the worker locally using `npm run dev`.
Before running, you should create a local D1 database:

```bash
wrangler d1 migrations apply pdf2zh-web --local
# Or if using schema.sql directly:
wrangler d1 execute pdf2zh-db --local --file=./schema.sql
```

Set your local secrets in `.dev.vars`:
```env
PROXY_SECRET=mock_proxy_secret
AGENT_TOKEN=mock_agent_token
```

## Deployment

1. Create a D1 database:
   ```bash
   wrangler d1 create pdf2zh-db
   ```
2. Update `wrangler.toml` with the generated `database_id`.
3. Apply schema to remote:
   ```bash
   wrangler d1 execute pdf2zh-db --remote --file=./schema.sql
   ```
4. Put secrets:
   ```bash
   wrangler secret put PROXY_SECRET
   wrangler secret put AGENT_TOKEN
   ```
5. Deploy:
   ```bash
   npm run deploy
   ```
