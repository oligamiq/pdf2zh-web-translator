ALTER TABLE jobs ADD COLUMN owner_type TEXT NOT NULL DEFAULT 'firebase';
ALTER TABLE jobs ADD COLUMN public_receipt_hash TEXT;
ALTER TABLE jobs ADD COLUMN public_client_hash TEXT;
ALTER TABLE jobs ADD COLUMN public_ip_hash TEXT;
ALTER TABLE jobs ADD COLUMN public_expires_at TEXT;
ALTER TABLE jobs ADD COLUMN file_size_bytes INTEGER;
ALTER TABLE jobs ADD COLUMN turnstile_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN llm_credential_mode TEXT;

CREATE TABLE IF NOT EXISTS public_rate_limits (
  key TEXT PRIMARY KEY,
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
