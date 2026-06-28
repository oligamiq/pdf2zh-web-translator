ALTER TABLE job_api_provider_snapshots ADD COLUMN total_requests INTEGER NOT NULL DEFAULT 0;
ALTER TABLE job_api_provider_snapshots ADD COLUMN success_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE job_api_provider_snapshots ADD COLUMN failure_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE job_api_provider_snapshots ADD COLUMN last_http_status INTEGER;
ALTER TABLE job_api_provider_snapshots ADD COLUMN last_error TEXT;
ALTER TABLE job_api_provider_snapshots ADD COLUMN rate_limit_count INTEGER NOT NULL DEFAULT 0;
