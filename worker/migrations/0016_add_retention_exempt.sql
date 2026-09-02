-- Persist authenticated retention exemptions on jobs so future cleanup can safely exclude them.
ALTER TABLE jobs ADD COLUMN retention_exempt INTEGER NOT NULL DEFAULT 0;
