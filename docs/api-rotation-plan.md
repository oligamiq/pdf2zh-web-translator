# API Rotation Implementation Plan

## Global Constraints
- Target Language default moved to Settings, Upload uses temporary choice.
- Upload UI must not contain API settings fields.
- `GET /settings/api/providers` must NOT return raw API keys.
- Worker must snapshot providers at job creation time.
- Settings changes during conversion must not affect running jobs.
- `pc-api-python` must implement fallback based on HTTP status codes.

## Task 1: Database Migrations and Worker API (Settings & Jobs)
- Add D1 migration for:
  - `user_api_providers`
  - `job_api_provider_snapshots`
  - `job_api_provider_attempts`
- Add API endpoints:
  - `GET /settings/api/basic`
  - `PUT /settings/api/basic`
  - `GET /settings/api/providers`
  - `POST /settings/api/providers`
  - `PUT /settings/api/providers/:id`
  - `DELETE /settings/api/providers/:id`
  - `POST /settings/api/providers/:id/test`
  - `POST /settings/api/providers/reorder`
- Implement backward compatibility logic: when querying providers, if none exist, migrate `user_llm_settings` to `user_api_providers`.
- Update `POST /jobs` to query `enabled=1` providers ordered by `priority`, insert into `job_api_provider_snapshots`. Return 400 error `api_key_required` if no providers exist.

## Task 2: Python Worker Fallback
- Modify `pc-api-python/main.py` to retrieve `job_api_provider_snapshots` when claiming a job. (Worker API `POST /agent/claim` must include them).
- Loop through providers. For each:
  - Report attempt started (add `POST /agent/jobs/:id/attempts` to Worker API if needed, or just include in progress).
  - Run translation.
  - If 401/403/400/429/5xx, catch and record as failed, then continue to next provider.
  - If success, break loop.
- Update progress reporting to include `active_provider_name`.

## Task 3: Frontend Settings and Upload UI
- Remove API inputs from `UploadForm.tsx`.
- Add Modal for `api_key_required` error on job creation.
- Update `/settings/llm` (or new Settings components) for Basic Translation/API settings.
- Create Advanced API Routing components for provider CRUD operations.

## Task 4: Frontend Job Details and E2E Tests
- Update `JobDetail.tsx` to display API attempts.
- Write E2E tests validating the UX flow (no API key on upload, basic settings works, advanced settings works, fallback works).
