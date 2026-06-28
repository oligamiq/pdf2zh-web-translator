import * as fs from 'fs';

let content = fs.readFileSync('src/index.ts', 'utf-8');

// 1. PUT /settings/api/basic - Create default Ollama
content = content.replace(
  /INSERT INTO user_api_providers \(id, user_id, display_name, provider_type, base_url, model, encrypted_api_key, api_key_iv, api_key_key_version, priority, enabled\)\s*VALUES \(\?, \?, 'Ollama', 'openai_compatible', 'https:\/\/api\.ollama\.com\/v1', 'gpt-oss:20b', \?, \?, \?, 1, 1\)/g,
  "INSERT INTO user_api_providers (id, user_id, display_name, provider_type, base_url, model, encrypted_api_key, api_key_iv, api_key_key_version, priority, enabled, timeout_seconds, reasoning_effort)\n        VALUES (?, ?, 'Ollama', 'openai_compatible', 'https://api.ollama.com/v1', 'gemma4:31b-cloud', ?, ?, ?, 1, 1, 500, 'high')"
);

// 2. POST /settings/api/providers
content = content.replace(
  /const \{ display_name, provider_type, base_url, model, api_key, enabled \} = body;/g,
  "const { display_name, provider_type, base_url, model, api_key, enabled, timeout_seconds, reasoning_effort } = body;"
);
content = content.replace(
  /INSERT INTO user_api_providers \(id, user_id, display_name, provider_type, base_url, model, encrypted_api_key, api_key_iv, api_key_key_version, priority, enabled\)\s*VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, \?, \?, \?\)\s*`\)\.bind\(id, uid, display_name \|\| 'New Provider', provider_type, base_url \|\| '', model \|\| '', newEncryptedKey, newIv, newKeyVersion, existingCount \+ 1, enabled \?\? 1\)/g,
  "INSERT INTO user_api_providers (id, user_id, display_name, provider_type, base_url, model, encrypted_api_key, api_key_iv, api_key_key_version, priority, enabled, timeout_seconds, reasoning_effort)\n    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\n  `).bind(id, uid, display_name || 'New Provider', provider_type, base_url || '', model || '', newEncryptedKey, newIv, newKeyVersion, existingCount + 1, enabled ?? 1, timeout_seconds ?? null, reasoning_effort ?? null)"
);

// 3. PUT /settings/api/providers/:id
content = content.replace(
  /const \{ display_name, provider_type, base_url, model, api_key, clear_api_key, enabled \} = body;/g,
  "const { display_name, provider_type, base_url, model, api_key, clear_api_key, enabled, timeout_seconds, reasoning_effort } = body;"
);
content = content.replace(
  /api_key_key_version = coalesce\(\?, api_key_key_version\),\s*enabled = coalesce\(\?, enabled\),\s*updated_at = CURRENT_TIMESTAMP/g,
  "api_key_key_version = coalesce(?, api_key_key_version),\n      enabled = coalesce(?, enabled),\n      timeout_seconds = coalesce(?, timeout_seconds),\n      reasoning_effort = coalesce(?, reasoning_effort),\n      updated_at = CURRENT_TIMESTAMP"
);
content = content.replace(
  /\.bind\(display_name, provider_type, base_url, model, newEncryptedKey, newIv, newKeyVersion, enabled, id, uid\)/g,
  ".bind(display_name, provider_type, base_url, model, newEncryptedKey, newIv, newKeyVersion, enabled, timeout_seconds ?? null, reasoning_effort ?? null, id, uid)"
);

// 4. GET /settings/api/providers
content = content.replace(
  /enabled: p\.enabled,\s*created_at: p\.created_at/g,
  "enabled: p.enabled,\n    timeout_seconds: p.timeout_seconds,\n    reasoning_effort: p.reasoning_effort,\n    created_at: p.created_at"
);

// 5. POST /jobs - Add to providersToSnapshot
content = content.replace(
  /priority: 1\s*\}\);/g,
  "priority: 1,\n        timeout_seconds: existing?.[0]?.timeout_seconds || null,\n        reasoning_effort: existing?.[0]?.reasoning_effort || null\n      });"
); // Wait, this matches the first one (Saved Provider) where existing is fetched. But there are multiple providersToSnapshot.push.
// Let's use more specific replacements.

fs.writeFileSync('src/index.ts', content);
