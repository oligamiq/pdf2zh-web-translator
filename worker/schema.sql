CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    worker_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    claimed_at DATETIME,
    started_at DATETIME,
    finished_at DATETIME,
    error_message TEXT,
    download_expires_at DATETIME,
    llm_source TEXT,
    llm_base_url TEXT,
    llm_model TEXT,
    encrypted_api_key_snapshot TEXT,
    api_key_snapshot_iv TEXT,
    api_key_key_version TEXT,
    owner_type TEXT NOT NULL DEFAULT 'firebase',
    public_receipt_hash TEXT,
    public_client_hash TEXT,
    public_ip_hash TEXT,
    public_expires_at TEXT,
    file_size_bytes INTEGER,
    turnstile_verified INTEGER NOT NULL DEFAULT 0,
    llm_credential_mode TEXT,
    progress_percent INTEGER NOT NULL DEFAULT 0,
    progress_phase TEXT,
    progress_message TEXT,
    log_tail TEXT,
    active_provider_name TEXT,
    deleted_at TEXT,
    execution_metadata TEXT,
    target_language TEXT NOT NULL DEFAULT 'ja'
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

CREATE TABLE IF NOT EXISTS user_llm_settings (
    user_id TEXT PRIMARY KEY,
    llm_source TEXT NOT NULL DEFAULT 'openaicompatible',
    llm_base_url TEXT NOT NULL,
    llm_model TEXT NOT NULL,
    encrypted_api_key TEXT,
    api_key_iv TEXT,
    api_key_key_version TEXT NOT NULL DEFAULT 'v1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public_rate_limits (
    key TEXT PRIMARY KEY,
    window_start TEXT NOT NULL,
    count INTEGER NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    timeout_seconds INTEGER,
    reasoning_effort TEXT
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_requests INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    last_http_status INTEGER,
    last_error TEXT,
    rate_limit_count INTEGER NOT NULL DEFAULT 0,
    timeout_seconds INTEGER,
    reasoning_effort TEXT
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    provider_order INTEGER,
    display_name TEXT,
    model TEXT,
    http_status INTEGER
);

CREATE INDEX IF NOT EXISTS idx_job_api_provider_attempts_job_id ON job_api_provider_attempts(job_id);

CREATE TABLE IF NOT EXISTS user_basic_settings (
    user_id TEXT PRIMARY KEY,
    language TEXT,
    theme TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usage_limits (
    scope TEXT NOT NULL,
    subject_hash TEXT NOT NULL,
    day TEXT NOT NULL,
    jobs_created INTEGER NOT NULL DEFAULT 0,
    bytes_uploaded INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (scope, subject_hash, day)
);
