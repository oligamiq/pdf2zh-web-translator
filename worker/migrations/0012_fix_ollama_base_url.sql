-- Fix existing base_url for Ollama Cloud
UPDATE user_api_providers
SET base_url = 'https://ollama.com/v1'
WHERE base_url = 'https://api.ollama.com/v1';

UPDATE job_api_provider_snapshots
SET base_url = 'https://ollama.com/v1'
WHERE base_url = 'https://api.ollama.com/v1';
