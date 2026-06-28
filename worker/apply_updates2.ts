import * as fs from 'fs';

let content = fs.readFileSync('src/index.ts', 'utf-8');

// Task 2: PUT /settings/api/basic
// Update existing provider query
content = content.replace(
  /UPDATE user_api_providers SET\s+encrypted_api_key = \?,\s+api_key_iv = \?,\s+api_key_key_version = \?,\s+updated_at = CURRENT_TIMESTAMP/m,
  `UPDATE user_api_providers SET
          base_url = CASE WHEN base_url IS NULL OR base_url = '' OR base_url = 'Default URL' THEN 'https://api.ollama.com/v1' ELSE base_url END,
          model = CASE WHEN model IS NULL OR model = '' OR model = 'Default Model' THEN 'gpt-oss:20b' ELSE model END,
          encrypted_api_key = ?,
          api_key_iv = ?,
          api_key_key_version = ?,
          updated_at = CURRENT_TIMESTAMP`
);

// Insert new provider query
content = content.replace(
  /VALUES \(\?, \?, 'Ollama', 'openaicompatible', '', '', \?, \?, \?, 1, 1\)/g,
  "VALUES (?, ?, 'Ollama', 'openaicompatible', 'https://api.ollama.com/v1', 'gpt-oss:20b', ?, ?, ?, 1, 1)"
);

// Task 3: POST /settings/api/providers/:id/test
const testEndpointRegex = /app\.post\('\/settings\/api\/providers\/:id\/test', async \(c\) => \{[\s\S]*?\}\);/m;

const newTestEndpoint = `app.post('/settings/api/providers/:id/test', async (c) => {
  const uid = c.get('uid') as string;
  const id = c.req.param('id');
  
  const provider = await c.env.DB.prepare(\`SELECT * FROM user_api_providers WHERE id = ? AND user_id = ? AND deleted_at IS NULL\`).bind(id, uid).first();
  if (!provider) return c.json({ error: 'not_found' }, 404);
  
  let apiKey = '';
  if (provider.encrypted_api_key && provider.api_key_iv && c.env.USER_SETTINGS_SECRET) {
    try {
      apiKey = await decryptApiKey(
        provider.encrypted_api_key as string,
        provider.api_key_iv as string,
        c.env.USER_SETTINGS_SECRET,
        \`user_api_provider:\${uid}\`
      );
    } catch (e) {
      return c.json({ ok: false, error: 'decryption_failed' }, 400);
    }
    
    if (!apiKey) {
      return c.json({ error: 'missing_api_key', message: 'API key is not set.' }, 400);
    }
  }
  
  if (provider.provider_type === 'siliconflow_free') {
    return c.json({ ok: true });
  }

  if (!provider.base_url || provider.base_url === 'Default URL') {
    return c.json({ error: 'missing_base_url', message: 'Base URL is not set.' }, 400);
  }

  let testUrl = provider.base_url as string;
  testUrl = testUrl.replace(/\\/$/, '') + '/models';
  
  try {
    new URL(testUrl);
  } catch (e) {
    return c.json({ error: 'invalid_url', message: 'Invalid Base URL.' }, 400);
  }
  
  try {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = \`Bearer \${apiKey}\`;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const resp = await fetch(testUrl, {
      method: 'GET',
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (resp.ok) {
      return c.json({ ok: true });
    } else {
      return c.json({ error: 'api_error', message: \`Provider \${resp.status}\` }, resp.status as any);
    }
  } catch (e: any) {
    return c.json({ error: 'unreachable', message: 'Provider unreachable' }, 502);
  }
});`;

content = content.replace(testEndpointRegex, newTestEndpoint);

fs.writeFileSync('src/index.ts', content);
