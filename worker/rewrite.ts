import * as fs from 'fs';

let content = fs.readFileSync('src/index.ts', 'utf-8');

// 1. Add `ensureUserProviders` function after `checkRateLimit`
const ensureProvidersStr = `
async function ensureUserProviders(env: Env, uid: string) {
  const { results } = await env.DB.prepare(\`SELECT * FROM user_api_providers WHERE user_id = ? ORDER BY priority ASC, created_at ASC\`).bind(uid).all();
  if (results.length > 0) return results;

  const oldSettings = await env.DB.prepare(\`SELECT llm_source, llm_base_url, llm_model, encrypted_api_key, api_key_iv, api_key_key_version FROM user_llm_settings WHERE user_id = ?\`).bind(uid).first();
  if (oldSettings && oldSettings.encrypted_api_key && oldSettings.llm_source) {
    const newId = crypto.randomUUID();
    await env.DB.prepare(\`
      INSERT INTO user_api_providers (id, user_id, display_name, provider_type, base_url, model, encrypted_api_key, api_key_iv, api_key_key_version, priority, enabled)
      VALUES (?, ?, 'Ollama', ?, ?, ?, ?, ?, ?, 1, 1)
    \`).bind(newId, uid, oldSettings.llm_source, oldSettings.llm_base_url, oldSettings.llm_model, oldSettings.encrypted_api_key, oldSettings.api_key_iv, oldSettings.api_key_key_version || 'v1').run();
    const res2 = await env.DB.prepare(\`SELECT * FROM user_api_providers WHERE user_id = ? ORDER BY priority ASC, created_at ASC\`).bind(uid).all();
    return res2.results;
  }
  return [];
}
`;

content = content.replace(/async function fetchPrivateApi/, ensureProvidersStr + '\nasync function fetchPrivateApi');

// 2. Add API endpoints for basic and providers
const newSettingsApis = `
app.get('/settings/api/basic', async (c) => {
  return c.json({});
});

app.put('/settings/api/basic', async (c) => {
  return c.json({ success: true });
});

app.get('/settings/api/providers', async (c) => {
  const uid = c.get('uid') as string;
  const providers = await ensureUserProviders(c.env, uid);
  return c.json(providers.map((p: any) => ({
    id: p.id,
    display_name: p.display_name,
    provider_type: p.provider_type,
    base_url: p.base_url,
    model: p.model,
    priority: p.priority,
    enabled: p.enabled,
    created_at: p.created_at
  })));
});

app.post('/settings/api/providers', async (c) => {
  const uid = c.get('uid') as string;
  const body = await c.req.json();
  const { display_name, provider_type, base_url, model, api_key, enabled } = body;
  
  let newEncryptedKey = null;
  let newIv = null;
  let newKeyVersion = 'v1';
  
  if (api_key) {
    if (!c.env.USER_SETTINGS_SECRET) return c.json({ error: 'server_configuration_error', message: 'Missing secret' }, 500);
    const enc = await encryptApiKey(api_key, c.env.USER_SETTINGS_SECRET, \`user_api_provider:\${uid}\`);
    newEncryptedKey = enc.ciphertext;
    newIv = enc.iv;
    newKeyVersion = enc.keyVersion;
  }
  
  const existingCount = (await c.env.DB.prepare(\`SELECT COUNT(*) as c FROM user_api_providers WHERE user_id = ?\`).bind(uid).first())?.c as number || 0;
  
  const id = crypto.randomUUID();
  await c.env.DB.prepare(\`
    INSERT INTO user_api_providers (id, user_id, display_name, provider_type, base_url, model, encrypted_api_key, api_key_iv, api_key_key_version, priority, enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  \`).bind(id, uid, display_name || 'New Provider', provider_type, base_url || '', model || '', newEncryptedKey, newIv, newKeyVersion, existingCount + 1, enabled ?? 1).run();
  
  return c.json({ id });
});

app.put('/settings/api/providers/:id', async (c) => {
  const uid = c.get('uid') as string;
  const id = c.req.param('id');
  const body = await c.req.json();
  const { display_name, provider_type, base_url, model, api_key, clear_api_key, enabled } = body;
  
  const existing = await c.env.DB.prepare(\`SELECT * FROM user_api_providers WHERE id = ? AND user_id = ?\`).bind(id, uid).first();
  if (!existing) return c.json({ error: 'not_found' }, 404);
  
  let newEncryptedKey = existing.encrypted_api_key as string | null;
  let newIv = existing.api_key_iv as string | null;
  let newKeyVersion = existing.api_key_key_version as string;
  
  if (clear_api_key) {
    newEncryptedKey = null;
    newIv = null;
  } else if (api_key && api_key !== "") {
    if (!c.env.USER_SETTINGS_SECRET) return c.json({ error: 'server_configuration_error' }, 500);
    const enc = await encryptApiKey(api_key, c.env.USER_SETTINGS_SECRET, \`user_api_provider:\${uid}\`);
    newEncryptedKey = enc.ciphertext;
    newIv = enc.iv;
    newKeyVersion = enc.keyVersion;
  }
  
  await c.env.DB.prepare(\`
    UPDATE user_api_providers SET
      display_name = coalesce(?, display_name),
      provider_type = coalesce(?, provider_type),
      base_url = coalesce(?, base_url),
      model = coalesce(?, model),
      encrypted_api_key = ?,
      api_key_iv = ?,
      api_key_key_version = coalesce(?, api_key_key_version),
      enabled = coalesce(?, enabled),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  \`).bind(display_name, provider_type, base_url, model, newEncryptedKey, newIv, newKeyVersion, enabled, id, uid).run();
  
  return c.json({ success: true });
});

app.delete('/settings/api/providers/:id', async (c) => {
  const uid = c.get('uid') as string;
  const id = c.req.param('id');
  await c.env.DB.prepare(\`DELETE FROM user_api_providers WHERE id = ? AND user_id = ?\`).bind(id, uid).run();
  return c.json({ success: true });
});

app.post('/settings/api/providers/:id/test', async (c) => {
  return c.json({ ok: true });
});

app.post('/settings/api/providers/reorder', async (c) => {
  const uid = c.get('uid') as string;
  const body = await c.req.json();
  const { provider_ids } = body;
  if (!Array.isArray(provider_ids)) return c.json({ error: 'invalid_format' }, 400);
  
  const stmts = provider_ids.map((id, index) => 
    c.env.DB.prepare(\`UPDATE user_api_providers SET priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?\`).bind(index + 1, id, uid)
  );
  if (stmts.length > 0) {
    await c.env.DB.batch(stmts);
  }
  return c.json({ success: true });
});

// --- User Settings APIs (Public) ---
`;

content = content.replace(/\/\/ --- User Settings APIs \(Public\) ---/, newSettingsApis);

fs.writeFileSync('src/index.ts', content);
