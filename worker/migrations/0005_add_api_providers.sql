-- Migration: Add user_api_providers and job provider tables

CREATE TABLE IF NOT EXISTS user_api_providers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    provider_type TEXT NOT NULL,
    base_url TEXT NOT NULL,
    model TEXT NOT NULL,
    encrypted_api_key TEXT,
    api_key_iv TEXT,
    api_key_key_version TEXT NOT NULL DEFAULT 'v1',
    priority INTEGER NOT NULL DEFAULT 1,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_api_providers_user_id ON user_api_providers(user_id);

CREATE TABLE IF NOT EXISTS job_api_provider_snapshots (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    provider_type TEXT NOT NULL,
    base_url TEXT NOT NULL,
    model TEXT NOT NULL,
    encrypted_api_key TEXT,
    api_key_iv TEXT,
    api_key_key_version TEXT NOT NULL DEFAULT 'v1',
    priority INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_api_provider_snapshots_job_id ON job_api_provider_snapshots(job_id);

CREATE TABLE IF NOT EXISTS job_api_provider_attempts (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    snapshot_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    started_at DATETIME,
    finished_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_api_provider_attempts_job_id ON job_api_provider_attempts(job_id);

CREATE TABLE IF NOT EXISTS user_basic_settings (
    user_id TEXT PRIMARY KEY,
    language TEXT,
    theme TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
