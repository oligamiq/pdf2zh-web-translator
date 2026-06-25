# Real Conversion E2E Smoke Test Results

**Date**: 2026-06-26
**Command Executed**: `REAL_CONVERSION_TIMEOUT_SECONDS=600 ./scripts/e2e-real-conversion-smoke.sh`

## Coverage / Successful Scope
- Worker dev server start (`/healthz` check, with robust port acquisition and loop validation)
- PC API startup in Docker with mock configuration
- Real upload of test PDF (`fixtures/smoke-text.pdf`) via Worker -> PC API (`POST /jobs`)
- Agent claim via isolated `PC_AGENT_MODE=mock` environment
- Execution of actual `pdf2zh_next` inside container
- OpenAICompatible settings injected successfully via flags and env variables.
- Job progression to `succeeded` status
- Log Offset API correctness verified (pagination logic tested)
- Download API `200 OK`
- ZIP validation passed (dual & mono PDF artifacts successfully extracted)

## Important Notes
- **Service Selection Flag**: Confirmed the service selection flag is `--openaicompatible`.
- **Artifacts Generated**: The `pdf2zh_next` run successfully generated both `input.no_watermark.ja.dual.pdf` and `input.no_watermark.ja.mono.pdf` within the downloaded ZIP.
- **Not for CI**: This script actually uses real external API credentials (LLM translations) and network dependencies. It takes several minutes to complete and is intended for pre-production or manual testing, **NOT** for automated CI loops.
