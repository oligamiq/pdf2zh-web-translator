-- Migration: Add user_llm_settings and job snapshot columns

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

ALTER TABLE jobs ADD COLUMN llm_source TEXT;
ALTER TABLE jobs ADD COLUMN llm_base_url TEXT;
ALTER TABLE jobs ADD COLUMN llm_model TEXT;
ALTER TABLE jobs ADD COLUMN encrypted_api_key_snapshot TEXT;
ALTER TABLE jobs ADD COLUMN api_key_snapshot_iv TEXT;
ALTER TABLE jobs ADD COLUMN api_key_key_version TEXT;
