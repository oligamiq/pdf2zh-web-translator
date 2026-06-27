-- Migration: Add extra columns to job_api_provider_attempts and jobs

ALTER TABLE job_api_provider_attempts ADD COLUMN provider_order INTEGER;
ALTER TABLE job_api_provider_attempts ADD COLUMN display_name TEXT;
ALTER TABLE job_api_provider_attempts ADD COLUMN model TEXT;
ALTER TABLE job_api_provider_attempts ADD COLUMN http_status INTEGER;

ALTER TABLE jobs ADD COLUMN active_provider_name TEXT;
