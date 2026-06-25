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
    download_expires_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
