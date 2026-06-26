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
  return { ciphertext: toBase64(ciphertext), iv: toBase64(iv), keyVersion: 'v1' };
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
    allowHeaders: ['Content-Type', 'Authorization', 'X-Proxy-Secret'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
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

app.use('/jobs/*', authMiddleware)
app.use('/settings/*', authMiddleware)

// --- User Settings APIs (Public) ---

app.get('/settings/llm', async (c) => {
  const uid = c.get('uid') as string;
  const settings = await c.env.DB.prepare(`SELECT * FROM user_llm_settings WHERE user_id = ?`).bind(uid).first();
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
  
  const existing = await c.env.DB.prepare(`SELECT * FROM user_llm_settings WHERE user_id = ?`).bind(uid).first();
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
    const uid = c.get('uid') as string
    const id = crypto.randomUUID()
    // Wait, user uploads file. FormData or Stream?
    // Let's assume FormData for now
    const formData = await c.req.formData()
    const file = formData.get('pdf') as File
    if (!file) return c.json({ error: 'No pdf file' }, 400)

    // 0. Fetch user settings snapshot
    const settings = await c.env.DB.prepare(`SELECT * FROM user_llm_settings WHERE user_id = ?`).bind(uid).first();
    const llm_source = settings?.llm_source || 'openaicompatible';
    const llm_base_url = settings?.llm_base_url || '';
    const llm_model = settings?.llm_model || '';
    let encrypted_api_key_snapshot = null;
    let api_key_snapshot_iv = null;
    let api_key_key_version = null;

    if (settings?.encrypted_api_key && settings?.api_key_iv && c.env.USER_SETTINGS_SECRET) {
      try {
        const plainKey = await decryptApiKey(
          settings.encrypted_api_key as string,
          settings.api_key_iv as string,
          c.env.USER_SETTINGS_SECRET,
          `user_llm_settings:${uid}`
        );
        const reEncrypted = await encryptApiKey(
          plainKey,
          c.env.USER_SETTINGS_SECRET,
          `job_llm_snapshot:${id}`
        );
        encrypted_api_key_snapshot = reEncrypted.ciphertext;
        api_key_snapshot_iv = reEncrypted.iv;
        api_key_key_version = reEncrypted.keyVersion;
      } catch (e) {
        console.error("Failed to re-encrypt api key for snapshot", e);
        return c.json({ error: 'internal_error', message: 'Failed to snapshot settings' }, 500);
      }
    }

    // 1. Insert to D1
    await c.env.DB.prepare(
      `INSERT INTO jobs (
        id, user_id, original_filename, status,
        llm_source, llm_base_url, llm_model,
        encrypted_api_key_snapshot, api_key_snapshot_iv, api_key_key_version
      ) VALUES (?, ?, ?, 'queued', ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, uid, file.name,
      llm_source, llm_base_url, llm_model,
      encrypted_api_key_snapshot, api_key_snapshot_iv, api_key_key_version
    ).run()
    console.log("POST /jobs: created job", id)

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

    return c.json({ id, status: 'queued' })
  } catch (err) {
    console.error("POST /jobs failed", err);
    return c.json({
      error: "internal_error",
      message: err instanceof Error ? err.message : String(err),
    }, 500);
  }
})

app.get('/jobs', async (c) => {
  const uid = c.get('uid') as string
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC`
  ).bind(uid).all()
  return c.json(results)
})

app.get('/jobs/:id', async (c) => {
  const uid = c.get('uid') as string
  const id = c.req.param('id')
  const job = await c.env.DB.prepare(`SELECT * FROM jobs WHERE id = ? AND user_id = ?`).bind(id, uid).first()
  if (!job) return c.json({ error: 'Not found' }, 404)
  return c.json(job)
})

app.get('/jobs/:id/log', async (c) => {
  const uid = c.get('uid') as string
  const id = c.req.param('id')
  const job = await c.env.DB.prepare(`SELECT * FROM jobs WHERE id = ? AND user_id = ?`).bind(id, uid).first()
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

app.get('/jobs/:id/download', async (c) => {
  const uid = c.get('uid') as string
  const id = c.req.param('id')
  const job = await c.env.DB.prepare(`SELECT * FROM jobs WHERE id = ? AND user_id = ?`).bind(id, uid).first()
  if (!job) return c.json({ error: 'Not found' }, 404)
  if (job.status !== 'succeeded') return c.json({ error: 'Not ready' }, 409)

  if (job.download_expires_at) {
    const expiresAt = new Date(job.download_expires_at as string).getTime();
    if (Date.now() > expiresAt) {
      return c.json({ error: 'Download expired' }, 410)
    }
  }

  const resp = await fetchPrivateApi(c.env, `/internal/jobs/${id}/download`)
  if (!resp.ok) {
    return c.json({ error: 'Private API error' }, resp.status)
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
  const job = await c.env.DB.prepare(`SELECT * FROM jobs WHERE status = 'queued' ORDER BY created_at ASC LIMIT 1`).first()
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

app.post('/agent/jobs/:id/succeeded', async (c) => {
  const id = c.req.param('id')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  await c.env.DB.prepare(
    `UPDATE jobs SET status = 'succeeded', finished_at = ?, download_expires_at = ? WHERE id = ? AND status = 'running'`
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
