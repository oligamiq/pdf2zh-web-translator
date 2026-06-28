-- Migration: Add deleted_at to jobs

ALTER TABLE jobs ADD COLUMN deleted_at TEXT;
