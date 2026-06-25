# Mock E2E Smoke Test Results

**Date**: 2026-06-26
**Command Executed**: `./scripts/e2e-smoke.sh`

## Coverage / Successful Scope
- Worker dev server start (`/healthz` check)
- PC API startup in Docker (`/internal/healthz` check)
- PC API -> Worker reachability check
- Installation verification of `pdf2zh_next` inside the container
- File permission verification for `/data` host mounts
- Job submission (`POST /jobs` successful upload to D1 and Private API)
- Agent claim via isolated `PC_AGENT_MODE=mock` manual trigger
- Verification of job logging offset functionality
- Agent successful completion report
- Download API verification

## Important Notes
- **Mock Mode**: This is a mock E2E test. It does **not** perform a real, long-running PDF conversion via `pdf2zh_next`. It only mocks the job progression.
- **Isolated D1 State**: The E2E test uses a temporary Wrangler persist directory per run, which is designed to isolate the state from the normal local D1 database or past queued jobs.
- **Secrets & Variables**: `.dev.vars` is temporarily backed up and replaced with dynamically generated random `PROXY_SECRET` and `AGENT_TOKEN` just for the E2E run, and fully restored via trap cleanup upon exit. E2E tests do not depend on your production or local `.env` or `.dev.vars`.
- **Agent Loop Disabled**: The PC API agent's internal loop is temporarily disabled during this test using `PC_AGENT_AUTOSTART=false` to prevent race conditions with the manual E2E claim assertions.
- **Cloudflared**: Cloudflared is not started or required for this mock E2E test.
- **pdf2zh_next CLI Flags Warning**: Be aware that the `pdf2zh_next` service selection flag is `--openaicompatible` (without dashes after openai). Setting flags use dashes (e.g., `--openai-compatible-model`, `--openai-compatible-api-key`). Passing `--openai-compatible` without a suffix causes an `ambiguous option` error (exit code 2).
