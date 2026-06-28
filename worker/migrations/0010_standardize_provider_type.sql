-- Migration: Standardize provider_type to openai_compatible

UPDATE user_api_providers
SET provider_type = 'openai_compatible'
WHERE provider_type = 'openaicompatible';

UPDATE job_api_provider_snapshots
SET provider_type = 'openai_compatible'
WHERE provider_type = 'openaicompatible';

UPDATE user_llm_settings
SET llm_source = 'openai_compatible'
WHERE llm_source = 'openaicompatible';
