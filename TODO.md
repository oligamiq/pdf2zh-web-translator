# TODO

## Cleanup Legacy PDF View Token Compatibility
**Target Date: 2026-07-13T00:00:00.000Z**

The legacy PDF token fallback (`sha256Hex(job.id + PUBLIC_RATE_LIMIT_SALT)`) is set to naturally expire and invalidate in production at the timestamp above. After this date passes, the fallback code will no longer be functional. It should be safely removed to clean up the codebase.

### Steps to Remove:
1. In `worker/src/index.ts`, locate and remove the `getPublicJobWithLegacyFallback` function completely, changing call sites back to a direct DB query using the new `hmacSha256Hex` receipt hash.
2. In `worker/src/index.ts`, inside the PDF download endpoint (`app.get('/jobs/:id/files/:kind')`), locate the token check logic inside `job.owner_type === 'user' || job.owner_type === 'firebase'` and remove the `isLegacyFallback` and `legacyToken` checks entirely.
3. Remove `LEGACY_PDF_TOKEN_COMPAT_UNTIL` from `worker/wrangler.toml`.
4. Run `npx wrangler deploy` to push the cleaned-up code to production.
