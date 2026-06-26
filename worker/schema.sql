CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued', -- queued, running, succeeded, failed
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
    public_expires_at DATETIME,
    file_size_bytes INTEGER,
    turnstile_verified INTEGER NOT NULL DEFAULT 0,
    llm_credential_mode TEXT
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
