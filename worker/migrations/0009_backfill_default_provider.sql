-- Migration: Backfill default Ollama provider details

UPDATE user_api_providers 
SET base_url = 'https://api.ollama.com/v1' 
WHERE provider_type = 'openaicompatible' 
  AND display_name = 'Ollama' 
  AND (base_url IS NULL OR base_url = '' OR base_url = 'Default URL');

UPDATE user_api_providers 
SET model = 'gpt-oss:20b' 
WHERE provider_type = 'openaicompatible' 
  AND display_name = 'Ollama' 
  AND (model IS NULL OR model = '' OR model = 'Default Model');
