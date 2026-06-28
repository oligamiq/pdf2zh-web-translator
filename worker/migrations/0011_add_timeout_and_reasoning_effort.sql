ALTER TABLE user_api_providers ADD COLUMN timeout_seconds INTEGER;
ALTER TABLE user_api_providers ADD COLUMN reasoning_effort TEXT;

ALTER TABLE job_api_provider_snapshots ADD COLUMN timeout_seconds INTEGER;
ALTER TABLE job_api_provider_snapshots ADD COLUMN reasoning_effort TEXT;

UPDATE user_api_providers
SET model = 'gemma4:31b-cloud'
WHERE display_name = 'Ollama' AND provider_type = 'openai_compatible' AND (model IS NULL OR model = '' OR model = 'gpt-oss:20b');

UPDATE user_api_providers
SET timeout_seconds = 500
WHERE display_name = 'Ollama' AND provider_type = 'openai_compatible' AND timeout_seconds IS NULL;

UPDATE user_api_providers
SET reasoning_effort = 'high'
WHERE display_name = 'Ollama' AND provider_type = 'openai_compatible' AND (reasoning_effort IS NULL OR reasoning_effort = '');
