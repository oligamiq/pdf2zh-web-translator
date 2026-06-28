CREATE TABLE IF NOT EXISTS usage_limits (
  scope TEXT NOT NULL,
  subject_hash TEXT NOT NULL,
  day TEXT NOT NULL,
  jobs_created INTEGER NOT NULL DEFAULT 0,
  bytes_uploaded INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (scope, subject_hash, day)
);
