import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createRemoteJWKSet, jwtVerify, createLocalJWKSet } from 'jose'

export type Env = {
  DB: D1Database;
  PDF2ZH_PRIVATE_API?: Fetcher;
  PRIVATE_API_BASE_URL?: string;

  AUTH_MODE: string;
  PROXY_SECRET: string;
  AGENT_TOKEN: string;
  CORS_ORIGIN: string;
  FIREBASE_PROJECT_ID: string;
  USER_SETTINGS_SECRET?: string;
  PC_API_VPC?: Fetcher;

  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_TEST_BYPASS?: string;
  PUBLIC_RATE_LIMIT_SALT?: string;

  PUBLIC_FALLBACK_LLM_ENABLED?: string;
  PUBLIC_FALLBACK_LLM_SOURCE?: string;
  PUBLIC_FALLBACK_LLM_BASE_URL?: string;
  PUBLIC_FALLBACK_LLM_MODEL?: string;
  PUBLIC_FALLBACK_LLM_API_KEY?: string;
}

// --- Crypto Helpers for User LLM Settings ---
async function getCryptoKey(secretB64: string): Promise<CryptoKey> {
  const rawKey = Uint8Array.from(atob(secretB64), c => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

function encodeStr(str: string): Uint8Array { return new TextEncoder().encode(str); }
function decodeStr(buf: ArrayBuffer): string { return new TextDecoder().decode(buf); }
function toBase64(buf: ArrayBuffer): string { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function fromBase64(b64: string): Uint8Array { return Uint8Array.from(atob(b64), c => c.charCodeAt(0)); }

async function encryptApiKey(apiKey: string, secretB64: string, aadStr: string) {
  const key = await getCryptoKey(secretB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encodeStr(aadStr) },
    key,
    encodeStr(apiKey)
  );
  return { ciphertext: toBase64(ciphertext), iv: toBase64(iv.buffer), keyVersion: 'v1' };
}

async function decryptApiKey(ciphertextB64: string, ivB64: string, secretB64: string, aadStr: string) {
  try {
    const key = await getCryptoKey(secretB64);
    const iv = fromBase64(ivB64);
    const ciphertext = fromBase64(ciphertextB64);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: encodeStr(aadStr) },
      key,
      ciphertext
    );
    return decodeStr(plaintext);
  } catch (e) {
    throw new Error('decryption_failed');
  }
}

async function sha256Hex(message: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodeStr(message));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyTurnstile(token: string, secretKey: string | undefined, testBypass: string | undefined): Promise<boolean> {
  if (testBypass === 'true') return true;
  if (!secretKey || !token) return false;
  
  const formData = new FormData();
  formData.append('secret', secretKey);
  formData.append('response', token);

  try {
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      body: formData,
      method: 'POST',
    });
    const outcome = await result.json() as any;
    return !!outcome.success;
  } catch (e) {
    return false;
  }
}

async function checkRateLimit(db: D1Database, key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs).toISOString();
  
  await db.prepare(`
    INSERT INTO public_rate_limits (key, window_start, count)
    VALUES (?, ?, 1)
    ON CONFLICT(key) DO UPDATE SET
      count = CASE WHEN window_start < ? THEN 1 ELSE count + 1 END,
      window_start = CASE WHEN window_start < ? THEN ? ELSE window_start END,
      updated_at = ?
  `).bind(key, now.toISOString(), windowStart, windowStart, now.toISOString(), now.toISOString()).run();
  
  const record = await db.prepare(`SELECT count FROM public_rate_limits WHERE key = ?`).bind(key).first();
  if (!record) return false;
  return (record.count as number) <= limit;
}


async function ensureUserProviders(env: Env, uid: string) {
  const { results } = await env.DB.prepare(`SELECT * FROM user_api_providers WHERE user_id = ? ORDER BY priority ASC, created_at ASC`).bind(uid).all();
  if (results.length > 0) return results;

  const oldSettings = await env.DB.prepare(`SELECT llm_source, llm_base_url, llm_model, encrypted_api_key, api_key_iv, api_key_key_version FROM user_llm_settings WHERE user_id = ?`).bind(uid).first();
  if (oldSettings && oldSettings.encrypted_api_key && oldSettings.llm_source) {
    const newId = crypto.randomUUID();
    
    let encKey = oldSettings.encrypted_api_key as string;
    let iv = oldSettings.api_key_iv as string;
    let keyVersion = (oldSettings.api_key_key_version as string) || 'v1';
    
    if (env.USER_SETTINGS_SECRET) {
      try {
        const plainKey = await decryptApiKey(
          encKey,
          iv,
          env.USER_SETTINGS_SECRET,
          `user_llm_settings:${uid}`
        );
        const reEncrypted = await encryptApiKey(
          plainKey,
          env.USER_SETTINGS_SECRET,
          `user_api_provider:${uid}`
        );
        encKey = reEncrypted.ciphertext;
        iv = reEncrypted.iv;
        keyVersion = reEncrypted.keyVersion;
      } catch (e) {
        console.error("Migration decryption failed", e);
      }
    }
    
    let displayName = (oldSettings.llm_source as string) === 'openaicompatible' ? 'Ollama' : 
                      (oldSettings.llm_source as string).charAt(0).toUpperCase() + (oldSettings.llm_source as string).slice(1);
    
    await env.DB.prepare(`
      INSERT INTO user_api_providers (id, user_id, display_name, provider_type, base_url, model, encrypted_api_key, api_key_iv, api_key_key_version, priority, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
    `).bind(newId, uid, displayName, oldSettings.llm_source, oldSettings.llm_base_url, oldSettings.llm_model, encKey, iv, keyVersion).run();
    const res2 = await env.DB.prepare(`SELECT * FROM user_api_providers WHERE user_id = ? ORDER BY priority ASC, created_at ASC`).bind(uid).all();
    return res2.results;
  }
  return [];
}

async function fetchPrivateApi(
  env: Env,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const base = env.PRIVATE_API_BASE_URL || 'http://localhost';
  const targetUrl = new URL(path, base);

  const headers = new Headers(init.headers);
  if (env.PROXY_SECRET) {
    headers.set("X-Proxy-Secret", env.PROXY_SECRET);
  }

  const request = new Request(targetUrl.toString(), {
    ...init,
    headers,
  });

  if (env.PC_API_VPC) {
    return env.PC_API_VPC.fetch(request);
  }

  // local/mock E2E用
  if (env.PRIVATE_API_BASE_URL) {
    return fetch(request);
  }

  throw new Error("private API binding is not configured");
}

type Variables = {
  uid: string
}

const app = new Hono<{ Bindings: Env, Variables: Variables }>()

app.use('*', async (c, next) => {
  const origin = c.env.CORS_ORIGIN || '*'
  return cors({
    origin: origin,
    allowHeaders: ['Content-Type', 'Authorization', 'X-Proxy-Secret', 'X-Turnstile-Token'],
    allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
  })(c, next)
})

app.get('/healthz', (c) => {
  return c.json({
    ok: true,
    // @ts-ignore
    run_id: c.env.E2E_RUN_ID ?? null,
  });
});

const JWKS_URI = 'https://www.googleapis.com/robot/v1/metadata/jwk/securetoken@system.gserviceaccount.com'
const JWKS = createRemoteJWKSet(new URL(JWKS_URI))

async function verifyFirebaseToken(token: string, projectId: string, authMode: string, env: Env): Promise<string> {
  if (!token) throw new Error("No token")
  if (authMode === 'mock') {
    if (token.startsWith('mock-')) return 'mock-user-123'
    return 'mock-user-123' // fallback for testing
  }
  
  try {
    let jwks;
    // @ts-ignore
    if (env.FIREBASE_JWKS_OVERRIDE_JSON) {
      // @ts-ignore
      jwks = createLocalJWKSet(JSON.parse(env.FIREBASE_JWKS_OVERRIDE_JSON))
    } else {
      jwks = JWKS
    }
    
    // @ts-ignore
    let issuer = env.FIREBASE_ISSUER_OVERRIDE || `https://securetoken.google.com/${projectId}`;

    const { payload } = await jwtVerify(token, jwks, {
      issuer: issuer,
      audience: projectId,
    })
    
    if (!payload.sub) {
      throw new Error("Missing sub in token")
    }
    
    return payload.sub
  } catch (e: any) {
    throw new Error(`Invalid Firebase token: ${e.message}`)
  }
}

const authMiddleware = async (c: any, next: any) => {
  if (c.req.method === 'OPTIONS') return next()
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const token = authHeader.split(' ')[1]
  try {
    const uid = await verifyFirebaseToken(token, c.env.FIREBASE_PROJECT_ID, c.env.AUTH_MODE || 'firebase', c.env)
    c.set('uid', uid)
    await next()
  } catch (e) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
}

// apply auth middleware explicitly for GET /jobs routes later
app.use('/settings/*', authMiddleware)


app.get('/settings/api/basic', async (c) => {
  const uid = c.get('uid') as string;
  let default_target_language = 'zh';
  const basicSettings = await c.env.DB.prepare(`SELECT language FROM user_basic_settings WHERE user_id = ?`).bind(uid).first();
  if (basicSettings && basicSettings.language) {
    default_target_language = basicSettings.language as string;
  }
  
  const providers = await ensureUserProviders(c.env, uid);
  const ollamaProvider = providers.find((p: any) => p.provider_type === 'openaicompatible') || providers[0];
  
  let has_api_key = false;
  let api_key_last4 = null;
  
  if (ollamaProvider && ollamaProvider.encrypted_api_key) {
    has_api_key = true;
    if (c.env.USER_SETTINGS_SECRET && ollamaProvider.api_key_iv) {
      try {
        const plainKey = await decryptApiKey(
          ollamaProvider.encrypted_api_key as string,
          ollamaProvider.api_key_iv as string,
          c.env.USER_SETTINGS_SECRET,
          `user_api_provider:${uid}`
        );
        if (plainKey.length >= 4) {
          api_key_last4 = plainKey.slice(-4);
        } else {
          api_key_last4 = plainKey;
        }
      } catch (e) {
        console.error("Failed to decrypt for last4", e);
      }
    }
  }

  return c.json({
    default_target_language,
    ollama: {
      has_api_key,
      api_key_last4
    }
  });
});

app.put('/settings/api/basic', async (c) => {
  const uid = c.get('uid') as string;
  const body = await c.req.json();
  const { default_target_language, ollama_api_key, clear_ollama_api_key } = body;
  
  if (default_target_language !== undefined) {
    await c.env.DB.prepare(`
      INSERT INTO user_basic_settings (user_id, language, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        language = excluded.language,
        updated_at = CURRENT_TIMESTAMP
    `).bind(uid, default_target_language).run();
  }
  
  if (ollama_api_key !== undefined || clear_ollama_api_key) {
    const providers = await ensureUserProviders(c.env, uid);
    let providerToUpdate = providers.find((p: any) => p.provider_type === 'openaicompatible');
    if (!providerToUpdate && providers.length > 0) {
      providerToUpdate = providers[0];
    }
    
    if (providerToUpdate) {
      let newEncryptedKey = providerToUpdate.encrypted_api_key as string | null;
      let newIv = providerToUpdate.api_key_iv as string | null;
      let newKeyVersion = providerToUpdate.api_key_key_version as string;

      if (clear_ollama_api_key) {
        newEncryptedKey = null;
        newIv = null;
      } else if (ollama_api_key) {
        if (!c.env.USER_SETTINGS_SECRET) return c.json({ error: 'server_configuration_error' }, 500);
        const enc = await encryptApiKey(ollama_api_key, c.env.USER_SETTINGS_SECRET, `user_api_provider:${uid}`);
        newEncryptedKey = enc.ciphertext;
        newIv = enc.iv;
        newKeyVersion = enc.keyVersion;
      }
      
      await c.env.DB.prepare(`
        UPDATE user_api_providers SET
          encrypted_api_key = ?,
          api_key_iv = ?,
          api_key_key_version = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `).bind(newEncryptedKey, newIv, newKeyVersion, providerToUpdate.id, uid).run();
    } else if (ollama_api_key && !clear_ollama_api_key) {
      if (!c.env.USER_SETTINGS_SECRET) return c.json({ error: 'server_configuration_error' }, 500);
      const enc = await encryptApiKey(ollama_api_key, c.env.USER_SETTINGS_SECRET, `user_api_provider:${uid}`);
      await c.env.DB.prepare(`
        INSERT INTO user_api_providers (id, user_id, display_name, provider_type, base_url, model, encrypted_api_key, api_key_iv, api_key_key_version, priority, enabled)
        VALUES (?, ?, 'Ollama', 'openaicompatible', '', '', ?, ?, ?, 1, 1)
      `).bind(crypto.randomUUID(), uid, enc.ciphertext, enc.iv, enc.keyVersion).run();
    }
  }
  
  return c.json({ success: true });
});

app.get('/settings/api/providers', async (c) => {
  const uid = c.get('uid') as string;
  const providers = (await ensureUserProviders(c.env, uid)) as any[];
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
    const enc = await encryptApiKey(api_key, c.env.USER_SETTINGS_SECRET, `user_api_provider:${uid}`);
    newEncryptedKey = enc.ciphertext;
    newIv = enc.iv;
    newKeyVersion = enc.keyVersion;
  }
  
  const existingCount = (await c.env.DB.prepare(`SELECT COUNT(*) as c FROM user_api_providers WHERE user_id = ?`).bind(uid).first())?.c as number || 0;
  
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO user_api_providers (id, user_id, display_name, provider_type, base_url, model, encrypted_api_key, api_key_iv, api_key_key_version, priority, enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, uid, display_name || 'New Provider', provider_type, base_url || '', model || '', newEncryptedKey, newIv, newKeyVersion, existingCount + 1, enabled ?? 1).run();
  
  return c.json({ id });
});

app.put('/settings/api/providers/:id', async (c) => {
  const uid = c.get('uid') as string;
  const id = c.req.param('id');
  const body = await c.req.json();
  const { display_name, provider_type, base_url, model, api_key, clear_api_key, enabled } = body;
  
  const existing = await c.env.DB.prepare(`SELECT * FROM user_api_providers WHERE id = ? AND user_id = ?`).bind(id, uid).first();
  if (!existing) return c.json({ error: 'not_found' }, 404);
  
  let newEncryptedKey = existing.encrypted_api_key as string | null;
  let newIv = existing.api_key_iv as string | null;
  let newKeyVersion = existing.api_key_key_version as string;
  
  if (clear_api_key) {
    newEncryptedKey = null;
    newIv = null;
  } else if (api_key && api_key !== "") {
    if (!c.env.USER_SETTINGS_SECRET) return c.json({ error: 'server_configuration_error' }, 500);
    const enc = await encryptApiKey(api_key, c.env.USER_SETTINGS_SECRET, `user_api_provider:${uid}`);
    newEncryptedKey = enc.ciphertext;
    newIv = enc.iv;
    newKeyVersion = enc.keyVersion;
  }
  
  await c.env.DB.prepare(`
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
  `).bind(display_name, provider_type, base_url, model, newEncryptedKey, newIv, newKeyVersion, enabled, id, uid).run();
  
  return c.json({ success: true });
});

app.delete('/settings/api/providers/:id', async (c) => {
  const uid = c.get('uid') as string;
  const id = c.req.param('id');
  await c.env.DB.prepare(`DELETE FROM user_api_providers WHERE id = ? AND user_id = ?`).bind(id, uid).run();
  return c.json({ success: true });
});

app.post('/settings/api/providers/:id/test', async (c) => {
  const uid = c.get('uid') as string;
  const id = c.req.param('id');
  
  const provider = await c.env.DB.prepare(`SELECT * FROM user_api_providers WHERE id = ? AND user_id = ?`).bind(id, uid).first();
  if (!provider) return c.json({ error: 'not_found' }, 404);
  
  let apiKey = '';
  if (provider.encrypted_api_key && provider.api_key_iv && c.env.USER_SETTINGS_SECRET) {
    try {
      apiKey = await decryptApiKey(
        provider.encrypted_api_key as string,
        provider.api_key_iv as string,
        c.env.USER_SETTINGS_SECRET,
        `user_api_provider:${uid}`
      );
    } catch (e) {
      return c.json({ ok: false, error: 'decryption_failed' });
    }
  }
  
  if (!provider.base_url) {
    return c.json({ ok: false, error: 'missing_base_url' });
  }

  let testUrl = provider.base_url as string;
  testUrl = testUrl.replace(/\/$/, '') + '/models';
  
  try {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
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
      const text = await resp.text().catch(() => '');
      return c.json({ ok: false, error: `HTTP ${resp.status}`, details: text });
    }
  } catch (e: any) {
    return c.json({ ok: false, error: e.message || 'network_error' });
  }
});

app.post('/settings/api/providers/reorder', async (c) => {
  const uid = c.get('uid') as string;
  const body = await c.req.json();
  const { provider_ids } = body;
  if (!Array.isArray(provider_ids)) return c.json({ error: 'invalid_format' }, 400);
  
  const stmts = provider_ids.map((id, index) => 
    c.env.DB.prepare(`UPDATE user_api_providers SET priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`).bind(index + 1, id, uid)
  );
  if (stmts.length > 0) {
    await c.env.DB.batch(stmts);
  }
  return c.json({ success: true });
});

// --- User Settings APIs (Public) ---


app.get('/settings/llm', async (c) => {
  const uid = c.get('uid') as string;
  const settings = await c.env.DB.prepare(`SELECT user_id, llm_source, llm_base_url, llm_model, encrypted_api_key, api_key_iv FROM user_llm_settings WHERE user_id = ?`).bind(uid).first();
  if (!settings) {
    return c.json({ llm_source: 'openaicompatible', llm_base_url: '', llm_model: '', has_api_key: false });
  }
  return c.json({
    llm_source: settings.llm_source,
    llm_base_url: settings.llm_base_url,
    llm_model: settings.llm_model,
    has_api_key: !!settings.encrypted_api_key,
  });
});

app.put('/settings/llm', async (c) => {
  const uid = c.get('uid') as string;
  const body = await c.req.json();
  const { llm_source, llm_base_url, llm_model, api_key, clear_api_key } = body;
  
  if (llm_source && !['openaicompatible', 'openai', 'gemini', 'deepseek'].includes(llm_source)) {
    return c.json({ error: 'invalid_source' }, 400);
  }
  if (llm_base_url) {
    try {
      const url = new URL(llm_base_url);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
      if (['localhost', '127.0.0.1'].includes(url.hostname)) return c.json({ error: 'invalid_url' }, 400);
      const isLocalIP = /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|169\.254\.)/.test(url.hostname);
      if (isLocalIP) return c.json({ error: 'invalid_url' }, 400);
    } catch (e) {
      return c.json({ error: 'invalid_url' }, 400);
    }
  }
  if (llm_model && llm_model.length > 255) return c.json({ error: 'model_too_long' }, 400);
  if (api_key && api_key.length > 2048) return c.json({ error: 'api_key_too_long' }, 400);
  
  const existing = await c.env.DB.prepare(`SELECT user_id, llm_source, llm_base_url, llm_model, encrypted_api_key, api_key_iv FROM user_llm_settings WHERE user_id = ?`).bind(uid).first();
  if (api_key === "") {
    return c.json({ error: 'invalid_api_key', message: 'Use clear_api_key to remove' }, 400);
  }
  
  let newEncryptedKey = existing?.encrypted_api_key || null;
  let newIv = existing?.api_key_iv || null;
  let newKeyVersion = existing?.api_key_key_version || 'v1';
  
  if (clear_api_key) {
    newEncryptedKey = null;
    newIv = null;
  } else if (api_key) {
    if (!c.env.USER_SETTINGS_SECRET) return c.json({ error: 'server_configuration_error', message: 'Missing secret' }, 500);
    const enc = await encryptApiKey(api_key, c.env.USER_SETTINGS_SECRET, `user_llm_settings:${uid}`);
    newEncryptedKey = enc.ciphertext;
    newIv = enc.iv;
    newKeyVersion = enc.keyVersion;
  }
  
  const finalSource = llm_source ?? existing?.llm_source ?? 'openaicompatible';
  const finalUrl = llm_base_url ?? existing?.llm_base_url ?? '';
  const finalModel = llm_model ?? existing?.llm_model ?? '';
  
  await c.env.DB.prepare(`
    INSERT INTO user_llm_settings (user_id, llm_source, llm_base_url, llm_model, encrypted_api_key, api_key_iv, api_key_key_version, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      llm_source = excluded.llm_source,
      llm_base_url = excluded.llm_base_url,
      llm_model = excluded.llm_model,
      encrypted_api_key = excluded.encrypted_api_key,
      api_key_iv = excluded.api_key_iv,
      api_key_key_version = excluded.api_key_key_version,
      updated_at = CURRENT_TIMESTAMP
  `).bind(uid, finalSource, finalUrl, finalModel, newEncryptedKey, newIv, newKeyVersion).run();
  
  return c.json({ success: true });
});

// --- Job APIs (Public) ---

app.post('/jobs', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    let uid: string | null = null;
    let ownerType = 'public';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        uid = await verifyFirebaseToken(token, c.env.FIREBASE_PROJECT_ID, c.env.AUTH_MODE || 'firebase', c.env);
        ownerType = 'firebase';
      } catch (e) {
        return c.json({ error: 'Unauthorized' }, 401);
      }
    }

    const id = crypto.randomUUID()
    const formData = await c.req.formData()
    const file = formData.get('pdf') as unknown as File
    if (!file) return c.json({ error: 'No pdf file' }, 400)

    let receipt = '';
    let publicReceiptHash = null;
    let publicClientHash = null;
    let publicIpHash = null;
    let publicExpiresAt = null;
    let fileSizeBytes = file.size;
    let turnstileVerified = 0;
    
    let llm_source = 'openaicompatible';
    let llm_base_url = '';
    let llm_model = '';
    let encrypted_api_key_snapshot = null;
    let api_key_snapshot_iv = null;
    let api_key_key_version = null;
    let llm_credential_mode = 'none';

    const apiKey = formData.get('api_key') as string;
    const saveApiKey = formData.get('save_api_key_to_settings') === 'true';

    if (ownerType === 'public') {
      if (saveApiKey) {
        return c.json({ error: 'Sign in to save API key to settings.' }, 400);
      }
      if (file.size > 5 * 1024 * 1024) return c.json({ error: 'payload_too_large', message: 'Public mode is limited to 5MiB' }, 413);
      
      const turnstileToken = formData.get('turnstile') as string;
      const verified = await verifyTurnstile(turnstileToken, c.env.TURNSTILE_SECRET_KEY, c.env.TURNSTILE_TEST_BYPASS);
      if (!verified) return c.json({ error: 'turnstile_failed', message: 'Turnstile verification failed' }, 403);
      turnstileVerified = 1;
      
      const ip = c.req.header('cf-connecting-ip') || 'unknown';
      publicIpHash = await sha256Hex(ip + (c.env.PUBLIC_RATE_LIMIT_SALT || 'salt'));
      if (!await checkRateLimit(c.env.DB, `ip:${publicIpHash}`, 3, 24 * 60 * 60 * 1000)) {
         return c.json({ error: 'rate_limited', message: 'Too many requests from this IP' }, 429);
      }
      
      const clientId = formData.get('client_id') as string || 'unknown';
      publicClientHash = await sha256Hex(clientId + (c.env.PUBLIC_RATE_LIMIT_SALT || 'salt'));
      if (!await checkRateLimit(c.env.DB, `client:${publicClientHash}`, 1, 24 * 60 * 60 * 1000)) {
         return c.json({ error: 'rate_limited', message: 'Too many requests from this client' }, 429);
      }
      
      receipt = crypto.randomUUID();
      publicReceiptHash = await sha256Hex(receipt + (c.env.PUBLIC_RATE_LIMIT_SALT || 'salt'));
      
      const now = new Date();
      publicExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }

    
    let providersToSnapshot: any[] = [];

    if (apiKey) {
      llm_credential_mode = 'request_once';
      // User provided a one-off API key
      const tempId = crypto.randomUUID();
      let encKey = null;
      let iv = null;
      let keyVersion = 'v1';
      if (c.env.USER_SETTINGS_SECRET) {
        try {
          const enc = await encryptApiKey(apiKey, c.env.USER_SETTINGS_SECRET, `user_api_provider:${uid || 'public_user'}`);
          encKey = enc.ciphertext;
          iv = enc.iv;
          keyVersion = enc.keyVersion;
        } catch (e) {
          return c.json({ error: 'internal_error', message: 'Failed to encrypt API key' }, 500);
        }
      }
      
      // Get llm_source, model from somewhere, default to openaicompatible
      let source = 'openaicompatible';
      let baseUrl = '';
      let model = '';
      if (ownerType === 'firebase' && uid) {
          const existing = (await ensureUserProviders(c.env, uid)) as any[];
          if (existing.length > 0) {
              source = existing[0].provider_type;
              baseUrl = existing[0].base_url;
              model = existing[0].model;
          }
      }
      
      providersToSnapshot.push({
        display_name: 'Custom',
        provider_type: source,
        base_url: baseUrl,
        model: model,
        encrypted_api_key: encKey,
        api_key_iv: iv,
        api_key_key_version: keyVersion,
        priority: 1
      });

      if (ownerType === 'firebase' && saveApiKey && c.env.USER_SETTINGS_SECRET) {
        try {
          const existingCount = (await c.env.DB.prepare(`SELECT COUNT(*) as c FROM user_api_providers WHERE user_id = ?`).bind(uid).first())?.c as number || 0;
          await c.env.DB.prepare(`
            INSERT INTO user_api_providers (id, user_id, display_name, provider_type, base_url, model, encrypted_api_key, api_key_iv, api_key_key_version, priority, enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(crypto.randomUUID(), uid, 'Saved Provider', source, baseUrl, model, encKey, iv, keyVersion, existingCount + 1, 1).run();
        } catch (e) {
          console.error("Failed to save api key to settings", e);
        }
      }
    } else {
      if (ownerType === 'firebase' && uid) {
        llm_credential_mode = 'user_settings';
        const providers = await ensureUserProviders(c.env, uid);
        const enabledProviders = providers.filter((p: any) => p.enabled === 1);
        if (enabledProviders.length === 0) {
          return c.json({ error: 'api_key_required', message: 'Ollama API key is required. Please set it in Settings.' }, 400);
        }
        
        // Re-encrypt api keys for job snapshot
        for (const p of enabledProviders as any[]) {
            let encKey = p.encrypted_api_key;
            let iv = p.api_key_iv;
            let keyVersion = p.api_key_key_version;
            
            if (p.encrypted_api_key && p.api_key_iv && c.env.USER_SETTINGS_SECRET) {
                try {
                  const plainKey = await decryptApiKey(
                    p.encrypted_api_key,
                    p.api_key_iv,
                    c.env.USER_SETTINGS_SECRET,
                    `user_api_provider:${uid}`
                  );
                  const reEncrypted = await encryptApiKey(
                    plainKey,
                    c.env.USER_SETTINGS_SECRET,
                    `job_api_provider:${id}`
                  );
                  encKey = reEncrypted.ciphertext;
                  iv = reEncrypted.iv;
                  keyVersion = reEncrypted.keyVersion;
                } catch (e) {
                  console.error("Failed to re-encrypt api key for snapshot", e);
                  return c.json({ error: 'internal_error', message: 'Failed to snapshot settings' }, 500);
                }
            }
            
            providersToSnapshot.push({
                display_name: p.display_name,
                provider_type: p.provider_type,
                base_url: p.base_url,
                model: p.model,
                encrypted_api_key: encKey,
                api_key_iv: iv,
                api_key_key_version: keyVersion,
                priority: p.priority
            });
        }
      } else {
        if (c.env.PUBLIC_FALLBACK_LLM_ENABLED !== 'true') {
          return c.json({ error: 'Public fallback LLM is not configured. Please enter your own Ollama API key or sign in and configure Settings.' }, 503);
        }

        const source = c.env.PUBLIC_FALLBACK_LLM_SOURCE;
        const baseUrl = c.env.PUBLIC_FALLBACK_LLM_BASE_URL;
        const model = c.env.PUBLIC_FALLBACK_LLM_MODEL;
        const fallbackKey = c.env.PUBLIC_FALLBACK_LLM_API_KEY;

        if (!source || !baseUrl || !model || ((source === 'openaicompatible' || source === 'gemini') && !fallbackKey)) {
          return c.json({ error: 'Public fallback LLM is not configured. Please enter your own Ollama API key or sign in and configure Settings.' }, 503);
        }

        llm_credential_mode = 'free_fallback';
        let encKey = null;
        let iv = null;
        let keyVersion = 'v1';
        
        if (fallbackKey && c.env.USER_SETTINGS_SECRET) {
          try {
            const enc = await encryptApiKey(fallbackKey, c.env.USER_SETTINGS_SECRET, `job_api_provider:${id}`);
            encKey = enc.ciphertext;
            iv = enc.iv;
            keyVersion = enc.keyVersion;
          } catch (e) {
            return c.json({ error: 'internal_error', message: 'Failed to encrypt fallback API key' }, 500);
          }
        }
        
        providersToSnapshot.push({
            display_name: 'Public Fallback',
            provider_type: source,
            base_url: baseUrl,
            model: model,
            encrypted_api_key: encKey,
            api_key_iv: iv,
            api_key_key_version: keyVersion,
            priority: 1
        });
      }
    }
    
    if (providersToSnapshot.length > 0) {
        const first = providersToSnapshot[0];
        llm_source = first.provider_type;
        llm_base_url = first.base_url;
        llm_model = first.model;
        encrypted_api_key_snapshot = first.encrypted_api_key;
        api_key_snapshot_iv = first.api_key_iv;
        api_key_key_version = first.api_key_key_version;
    }

    // 1. Insert to D1
    await c.env.DB.prepare(
      `INSERT INTO jobs (
        id, user_id, original_filename, status,
        llm_source, llm_base_url, llm_model,
        encrypted_api_key_snapshot, api_key_snapshot_iv, api_key_key_version,
        owner_type, public_receipt_hash, public_client_hash, public_ip_hash,
        public_expires_at, file_size_bytes, turnstile_verified, llm_credential_mode
      ) VALUES (?, ?, ?, 'queued', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, uid || 'public_user', file.name,
      llm_source, llm_base_url, llm_model,
      encrypted_api_key_snapshot, api_key_snapshot_iv, api_key_key_version,
      ownerType, publicReceiptHash, publicClientHash, publicIpHash,
      publicExpiresAt, fileSizeBytes, turnstileVerified, llm_credential_mode
    ).run()
    
    // Insert into job_api_provider_snapshots
    if (providersToSnapshot.length > 0) {
        const stmts = providersToSnapshot.map(p => 
            c.env.DB.prepare(`
                INSERT INTO job_api_provider_snapshots (id, job_id, display_name, provider_type, base_url, model, encrypted_api_key, api_key_iv, api_key_key_version, priority)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(crypto.randomUUID(), id, p.display_name, p.provider_type, p.base_url, p.model, p.encrypted_api_key, p.api_key_iv, p.api_key_key_version, p.priority)
        );
        await c.env.DB.batch(stmts);
    }
    console.log("POST /jobs: created job", id, "owner_type:", ownerType)


    // 2. Stream to PC Private API
    console.log("POST /jobs: forwarding input to private API", `/internal/files/${id}/input`)
    const resp = await fetchPrivateApi(c.env, `/internal/files/${id}/input`, {
      method: 'PUT',
      body: file.stream(),
      // @ts-ignore
      duplex: 'half'
    })
    if (!resp.ok) {
      const privateBody = await resp.text().catch(() => "");
      console.error("POST /jobs: private API upload failed", {
        status: resp.status,
        statusText: resp.statusText,
        body: privateBody,
      });
      // Update D1 to failed if upload fails
      await c.env.DB.prepare(`UPDATE jobs SET status = 'failed', error_message = 'Upload failed' WHERE id = ?`).bind(id).run()
      return c.json({ error: 'private_api_upload_failed', status: resp.status, body: privateBody }, 502)
    }

    if (ownerType === 'public') {
      return c.json({ id, status: 'queued', receipt })
    }
    return c.json({ id, status: 'queued' })
  } catch (err) {
    console.error("POST /jobs failed", err);
    return c.json({
      error: "internal_error",
      message: err instanceof Error ? err.message : String(err),
    }, 500);
  }
})

app.get('/jobs', authMiddleware, async (c) => {
  const uid = c.get('uid') as string
  const { results } = await c.env.DB.prepare(
    `SELECT id, user_id, original_filename, status, error_message, file_size_bytes, turnstile_verified, created_at, started_at, finished_at, owner_type, llm_source, llm_model, llm_credential_mode, progress_percent, progress_phase, progress_message, log_tail FROM jobs WHERE user_id = ? ORDER BY created_at DESC`
  ).bind(uid).all()
  return c.json(results)
})

app.get('/jobs/:id', authMiddleware, async (c) => {
  const uid = c.get('uid') as string
  const id = c.req.param('id')
  const job = await c.env.DB.prepare(`SELECT id, user_id, original_filename, status, error_message, file_size_bytes, turnstile_verified, created_at, started_at, finished_at, download_expires_at, owner_type, llm_source, llm_model, llm_credential_mode, progress_percent, progress_phase, progress_message, log_tail FROM jobs WHERE id = ? AND user_id = ?`).bind(id, uid).first()
  if (!job) return c.json({ error: 'Not found' }, 404)
  return c.json(job)
})

app.get('/jobs/:id/log', authMiddleware, async (c) => {
  const uid = c.get('uid') as string
  const id = c.req.param('id')
  const job = await c.env.DB.prepare(`SELECT id, user_id, original_filename, status, error_message, file_size_bytes, turnstile_verified, created_at, started_at, finished_at, download_expires_at, owner_type, llm_source, llm_model, llm_credential_mode, progress_percent, progress_phase, progress_message, log_tail FROM jobs WHERE id = ? AND user_id = ?`).bind(id, uid).first()
  if (!job) return c.json({ error: 'Not found' }, 404)

  const offset = c.req.query('offset') || '0'
  const limit = c.req.query('limit') || '65536'

  const resp = await fetchPrivateApi(c.env, `/internal/jobs/${id}/log?offset=${offset}&limit=${limit}`)
  if (resp.ok) {
    const data = await resp.json()
    return c.json(data)
  }
  return c.json({ data: '', next_offset: parseInt(offset) })
})

app.get('/jobs/:id/download', authMiddleware, async (c) => {
  const uid = c.get('uid') as string
  const id = c.req.param('id')
  const job = await c.env.DB.prepare(`SELECT id, user_id, original_filename, status, error_message, file_size_bytes, turnstile_verified, created_at, started_at, finished_at, download_expires_at, owner_type, llm_source, llm_model, llm_credential_mode, progress_percent, progress_phase, progress_message, log_tail FROM jobs WHERE id = ? AND user_id = ?`).bind(id, uid).first()
  if (!job) return c.json({ error: 'Not found' }, 404)
  if (job.status !== 'completed' && job.status !== 'succeeded') return c.json({ error: 'Not ready' }, 409)

  if (job.download_expires_at) {
    const expiresAt = new Date(job.download_expires_at as string).getTime();
    if (Date.now() > expiresAt) {
      return c.json({ error: 'Download expired' }, 410)
    }
  }

  const resp = await fetchPrivateApi(c.env, `/internal/jobs/${id}/download`)
  if (!resp.ok) {
    return c.json({ error: 'Private API error' }, resp.status as any)
  }
  return new Response(resp.body, {
    status: resp.status,
    headers: resp.headers
  })
})


app.get('/public/jobs/:id', async (c) => {
  const id = c.req.param('id')
  const receipt = c.req.query('receipt')
  if (!receipt) return c.json({ error: 'Missing receipt' }, 403)
  
  const publicReceiptHash = await sha256Hex(receipt + (c.env.PUBLIC_RATE_LIMIT_SALT || 'salt'))
  const job = await c.env.DB.prepare(`SELECT id, user_id, original_filename, status, error_message, file_size_bytes, turnstile_verified, created_at, started_at, finished_at, download_expires_at, owner_type, llm_source, llm_model, llm_credential_mode, progress_percent, progress_phase, progress_message, log_tail FROM jobs WHERE id = ? AND owner_type = 'public' AND public_receipt_hash = ?`).bind(id, publicReceiptHash).first()
  if (!job) return c.json({ error: 'Not found or invalid receipt' }, 403)
  return c.json(job)
})

app.get('/public/jobs/:id/log', async (c) => {
  const id = c.req.param('id')
  const receipt = c.req.query('receipt')
  if (!receipt) return c.json({ error: 'Missing receipt' }, 403)

  const publicReceiptHash = await sha256Hex(receipt + (c.env.PUBLIC_RATE_LIMIT_SALT || 'salt'))
  const job = await c.env.DB.prepare(`SELECT id, user_id, original_filename, status, error_message, file_size_bytes, turnstile_verified, created_at, started_at, finished_at, download_expires_at, owner_type, llm_source, llm_model, llm_credential_mode, progress_percent, progress_phase, progress_message, log_tail FROM jobs WHERE id = ? AND owner_type = 'public' AND public_receipt_hash = ?`).bind(id, publicReceiptHash).first()
  if (!job) return c.json({ error: 'Not found or invalid receipt' }, 403)

  const offset = c.req.query('offset') || '0'
  const limit = c.req.query('limit') || '65536'

  const resp = await fetchPrivateApi(c.env, `/internal/jobs/${id}/log?offset=${offset}&limit=${limit}`)
  if (resp.ok) {
    const data = await resp.json()
    return c.json(data)
  }
  return c.json({ data: '', next_offset: parseInt(offset) })
})

app.get('/public/jobs/:id/download', async (c) => {
  const id = c.req.param('id')
  const receipt = c.req.query('receipt')
  if (!receipt) return c.json({ error: 'Missing receipt' }, 403)

  const publicReceiptHash = await sha256Hex(receipt + (c.env.PUBLIC_RATE_LIMIT_SALT || 'salt'))
  const job = await c.env.DB.prepare(`SELECT id, user_id, original_filename, status, error_message, file_size_bytes, turnstile_verified, created_at, started_at, finished_at, download_expires_at, owner_type, llm_source, llm_model, llm_credential_mode, progress_percent, progress_phase, progress_message, log_tail FROM jobs WHERE id = ? AND owner_type = 'public' AND public_receipt_hash = ?`).bind(id, publicReceiptHash).first()
  if (!job) return c.json({ error: 'Not found or invalid receipt' }, 403)
  if (job.status !== 'completed' && job.status !== 'succeeded') return c.json({ error: 'Not ready' }, 409)

  if (job.download_expires_at) {
    const expiresAt = new Date(job.download_expires_at as string).getTime();
    if (Date.now() > expiresAt) {
      return c.json({ error: 'Download expired' }, 410)
    }
  }

  const resp = await fetchPrivateApi(c.env, `/internal/jobs/${id}/download`)
  if (!resp.ok) {
    return c.json({ error: 'Private API error' }, resp.status as any)
  }
  return new Response(resp.body, {
    status: resp.status,
    headers: resp.headers
  })
})


// --- Agent APIs (Internal polling from PC) ---

app.use('/agent/*', async (c, next) => {
  const token = c.req.header('Authorization')
  if (!token || token !== `Bearer ${c.env.AGENT_TOKEN}`) {
    return c.json({ error: 'Unauthorized agent' }, 401)
  }
  await next()
})

app.post('/agent/claim', async (c) => {
  const body = await c.req.json()
  const workerId = body.worker_id || 'default-worker'
  
  // Find a queued job
  const job = await c.env.DB.prepare(`SELECT id, original_filename, llm_source, llm_base_url, llm_model, encrypted_api_key_snapshot, api_key_snapshot_iv, owner_type, public_client_hash, public_ip_hash, public_expires_at, file_size_bytes, turnstile_verified, llm_credential_mode FROM jobs WHERE status = 'queued' ORDER BY created_at ASC LIMIT 1`).first()
  if (!job) return c.json({ job: null })

  let decryptedApiKey = null;
  if (job.encrypted_api_key_snapshot && job.api_key_snapshot_iv && c.env.USER_SETTINGS_SECRET) {
    try {
      decryptedApiKey = await decryptApiKey(
        job.encrypted_api_key_snapshot as string,
        job.api_key_snapshot_iv as string,
        c.env.USER_SETTINGS_SECRET,
        `job_llm_snapshot:${job.id}`
      );
    } catch (e) {
      console.error("Failed to decrypt snapshot api key for job", job.id);
      await c.env.DB.prepare(`UPDATE jobs SET status = 'failed', error_message = 'Failed to decrypt LLM settings snapshot' WHERE id = ?`).bind(job.id).run();
      return c.json({ job: null });
    }
  }

  const now = new Date().toISOString()
  const result = await c.env.DB.prepare(
    `UPDATE jobs SET status = 'running', worker_id = ?, claimed_at = ?, started_at = ? WHERE id = ? AND status = 'queued'`
  ).bind(workerId, now, now, job.id).run()

  if (result.meta.changes === 1) {
    return c.json({
      job: {
        id: job.id,
        llm_settings: {
          source: job.llm_source,
          base_url: job.llm_base_url,
          model: job.llm_model,
          api_key: decryptedApiKey
        }
      }
    })
  }
  return c.json({ job: null })
})

app.post('/agent/jobs/:id/progress', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const now = new Date().toISOString()
  
  let status = body.status || 'running';
  if (status === 'succeeded') status = 'completed';

  const phase = body.progress_phase || '';
  const message = body.progress_message || '';
  const errorMsg = body.error_message || null;
  const logTail = body.log_tail || null;

  const existing = await c.env.DB.prepare(`SELECT progress_percent FROM jobs WHERE id = ?`).bind(id).first();
  if (!existing) return c.json({ error: 'Not found' }, 404);

  const oldPercent = (existing.progress_percent as number) ?? 0;
  let newPercent = body.progress_percent ?? oldPercent;
  
  newPercent = Math.max(0, Math.min(100, Math.round(newPercent)));

  if (status === 'completed') {
    newPercent = 100;
  } else if (status === 'running') {
    newPercent = Math.max(oldPercent, newPercent);
  }

  if (status === 'failed') {
    await c.env.DB.prepare(
      `UPDATE jobs SET status = 'failed', finished_at = ?, progress_percent = ?, progress_phase = ?, error_message = ?, log_tail = ? WHERE id = ? AND status = 'running'`
    ).bind(now, newPercent, phase, errorMsg, logTail, id).run()
  } else if (status === 'completed') {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await c.env.DB.prepare(
      `UPDATE jobs SET status = 'completed', finished_at = ?, download_expires_at = ?, progress_percent = ?, progress_phase = ?, progress_message = ?, log_tail = ? WHERE id = ? AND status = 'running'`
    ).bind(now, expiresAt.toISOString(), newPercent, phase, message, logTail, id).run()
  } else {
    await c.env.DB.prepare(
      `UPDATE jobs SET status = 'running', progress_percent = ?, progress_phase = ?, progress_message = ?, log_tail = ? WHERE id = ? AND status = 'running'`
    ).bind(newPercent, phase, message, logTail, id).run()
  }
  return c.json({ ok: true })
})

app.post('/agent/jobs/:id/succeeded', async (c) => {
  const id = c.req.param('id')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  await c.env.DB.prepare(
    `UPDATE jobs SET status = 'completed', finished_at = ?, download_expires_at = ?, progress_percent = 100, progress_phase = 'completed' WHERE id = ? AND status = 'running'`
  ).bind(now.toISOString(), expiresAt.toISOString(), id).run()
  return c.json({ ok: true })
})

app.post('/agent/jobs/:id/failed', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    `UPDATE jobs SET status = 'failed', finished_at = ?, error_message = ? WHERE id = ? AND status = 'running'`
  ).bind(now, body.error || 'Unknown error', id).run()
  return c.json({ ok: true })
})

app.post('/agent/heartbeat', async (c) => {
  return c.json({ ok: true })
})

app.get('/admin/pc-api-health', async (c) => {
  const token = c.req.header('Authorization');
  if (!token || token !== `Bearer ${c.env.AGENT_TOKEN}`) {
    return c.json({ error: 'Unauthorized admin' }, 401);
  }
  try {
    const resp = await fetchPrivateApi(c.env, '/internal/healthz');
    return c.json({ ok: true, pc_api_status: resp.status });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 502);
  }
})

export default app
