import * as fs from 'fs';

let content = fs.readFileSync('src/index.ts', 'utf-8');

// 1. PUT /settings/api/basic
// Update existing provider query
content = content.replace(
  /model = CASE WHEN model IS NULL OR model = '' OR model = 'Default Model' THEN 'gpt-oss:20b' ELSE model END,/g,
  `model = CASE WHEN model IS NULL OR model = '' OR model = 'Default Model' THEN 'gemma4:31b-cloud' ELSE model END,
          timeout_seconds = coalesce(timeout_seconds, 500),
          reasoning_effort = coalesce(reasoning_effort, 'high'),`
);

// Insert new provider query
content = content.replace(
  /INSERT INTO user_api_providers \(id, user_id, display_name, provider_type, base_url, model, encrypted_api_key, api_key_iv, api_key_key_version, priority, enabled\)\n\s*VALUES \(\?, \?, 'Ollama', 'openai_compatible', 'https:\/\/api\.ollama\.com\/v1', 'gpt-oss:20b', \?, \?, \?, 1, 1\)/g,
  "INSERT INTO user_api_providers (id, user_id, display_name, provider_type, base_url, model, encrypted_api_key, api_key_iv, api_key_key_version, priority, enabled, timeout_seconds, reasoning_effort)\n        VALUES (?, ?, 'Ollama', 'openai_compatible', 'https://api.ollama.com/v1', 'gemma4:31b-cloud', ?, ?, ?, 1, 1, 500, 'high')"
);

// 2. POST /settings/api/providers
content = content.replace(
  /const \{ display_name, provider_type, base_url, model, api_key, enabled \} = body;/g,
  "const { display_name, provider_type, base_url, model, api_key, enabled, timeout_seconds, reasoning_effort } = body;"
);
content = content.replace(
  /INSERT INTO user_api_providers \(id, user_id, display_name, provider_type, base_url, model, encrypted_api_key, api_key_iv, api_key_key_version, priority, enabled\)\n\s*VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?\)\n\s*`\)\.bind\(id, uid, display_name \|\| 'New Provider', provider_type, base_url \|\| '', model \|\| '', newEncryptedKey, newIv, newKeyVersion, existingCount \+ 1, enabled \?\? 1\)/g,
  "INSERT INTO user_api_providers (id, user_id, display_name, provider_type, base_url, model, encrypted_api_key, api_key_iv, api_key_key_version, priority, enabled, timeout_seconds, reasoning_effort)\n    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\n  `).bind(id, uid, display_name || 'New Provider', provider_type, base_url || '', model || '', newEncryptedKey, newIv, newKeyVersion, existingCount + 1, enabled ?? 1, timeout_seconds ?? null, reasoning_effort ?? null)"
);

// 3. PUT /settings/api/providers/:id
content = content.replace(
  /const \{ display_name, provider_type, base_url, model, api_key, clear_api_key, enabled \} = body;/g,
  "const { display_name, provider_type, base_url, model, api_key, clear_api_key, enabled, timeout_seconds, reasoning_effort } = body;"
);
content = content.replace(
  /api_key_key_version = coalesce\(\?, api_key_key_version\),\n\s*enabled = coalesce\(\?, enabled\),\n\s*updated_at = CURRENT_TIMESTAMP/g,
  "api_key_key_version = coalesce(?, api_key_key_version),\n      enabled = coalesce(?, enabled),\n      timeout_seconds = coalesce(?, timeout_seconds),\n      reasoning_effort = coalesce(?, reasoning_effort),\n      updated_at = CURRENT_TIMESTAMP"
);
content = content.replace(
  /\.bind\(display_name, provider_type, base_url, model, newEncryptedKey, newIv, newKeyVersion, enabled, id, uid\)/g,
  ".bind(display_name, provider_type, base_url, model, newEncryptedKey, newIv, newKeyVersion, enabled, timeout_seconds ?? null, reasoning_effort ?? null, id, uid)"
);

// 4. GET /settings/api/providers
content = content.replace(
  /enabled: p\.enabled,\n\s*created_at: p\.created_at/g,
  "enabled: p.enabled,\n    timeout_seconds: p.timeout_seconds,\n    reasoning_effort: p.reasoning_effort,\n    created_at: p.created_at"
);

// 5. POST /jobs - Add to providersToSnapshot
content = content.replace(
  /legacy_api_key_key_version: legacyKeyVersion,\n\s*priority: p\.priority/g,
  "legacy_api_key_key_version: legacyKeyVersion,\n                priority: p.priority,\n                timeout_seconds: p.timeout_seconds,\n                reasoning_effort: p.reasoning_effort"
);
content = content.replace(
  /legacy_api_key_key_version: legacyKeyVersion,\n\s*priority: 1/g,
  "legacy_api_key_key_version: legacyKeyVersion,\n            priority: 1,\n            timeout_seconds: null,\n            reasoning_effort: null"
);

// 6. POST /jobs - job_api_provider_snapshots DB insert
content = content.replace(
  /INSERT INTO job_api_provider_snapshots \(id, job_id, display_name, provider_type, base_url, model, encrypted_api_key, api_key_iv, api_key_key_version, priority\)\n\s*VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, \?, \?\)\n\s*`\)\.bind\(crypto\.randomUUID\(\), id, p\.display_name, p\.provider_type, p\.base_url, p\.model, p\.encrypted_api_key, p\.api_key_iv, p\.api_key_key_version, p\.priority\)/g,
  "INSERT INTO job_api_provider_snapshots (id, job_id, display_name, provider_type, base_url, model, encrypted_api_key, api_key_iv, api_key_key_version, priority, timeout_seconds, reasoning_effort)\n                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\n            `).bind(crypto.randomUUID(), id, p.display_name, p.provider_type, p.base_url, p.model, p.encrypted_api_key, p.api_key_iv, p.api_key_key_version, p.priority, p.timeout_seconds ?? null, p.reasoning_effort ?? null)"
);

// 7. agent/claim
content = content.replace(
  /api_key: snapDecryptedKey,\n\s*priority: snap\.priority/g,
  "api_key: snapDecryptedKey,\n        priority: snap.priority,\n        timeout_seconds: snap.timeout_seconds,\n        reasoning_effort: snap.reasoning_effort"
);

fs.writeFileSync('src/index.ts', content);
