import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createRemoteJWKSet, jwtVerify } from 'jose'

export type Env = {
  DB: D1Database;
  PDF2ZH_PRIVATE_API?: Fetcher;
  PRIVATE_API_BASE_URL?: string;

  AUTH_MODE: string;
  PROXY_SECRET: string;
  AGENT_TOKEN: string;
  CORS_ORIGIN: string;
  FIREBASE_PROJECT_ID: string;
}

async function fetchPrivateApi(
  env: Env,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);

  if (env.PROXY_SECRET) {
    headers.set("X-Proxy-Secret", env.PROXY_SECRET);
  }

  // local/mock E2E用
  if (env.PRIVATE_API_BASE_URL) {
    const base = env.PRIVATE_API_BASE_URL.replace(/\/+$/, "");
    const url = `${base}${path}`;
    console.log("fetchPrivateApi: url", url);
    return fetch(url, {
      ...init,
      headers,
    });
  }

  // production用 Workers VPC service binding
  if (env.PDF2ZH_PRIVATE_API) {
    return env.PDF2ZH_PRIVATE_API.fetch(`http://pc-api${path}`, {
      ...init,
      headers,
    });
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

async function verifyFirebaseToken(token: string, projectId: string, authMode: string): Promise<string> {
  if (!token) throw new Error("No token")
  if (authMode === 'mock') {
    if (token.startsWith('mock-')) return 'mock-user-123'
    return 'mock-user-123' // fallback for testing
  }
  
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
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

// Auth Middleware
app.use('/jobs/*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return next()
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const token = authHeader.split(' ')[1]
  try {
    const uid = await verifyFirebaseToken(token, c.env.FIREBASE_PROJECT_ID, c.env.AUTH_MODE || 'firebase')
    c.set('uid', uid)
    await next()
  } catch (e) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})

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

    // 1. Insert to D1
    await c.env.DB.prepare(
      `INSERT INTO jobs (id, user_id, original_filename, status) VALUES (?, ?, ?, 'queued')`
    ).bind(id, uid, file.name).run()
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
  const job = await c.env.DB.prepare(`SELECT id FROM jobs WHERE status = 'queued' ORDER BY created_at ASC LIMIT 1`).first()
  if (!job) return c.json({ job: null })

  const now = new Date().toISOString()
  const result = await c.env.DB.prepare(
    `UPDATE jobs SET status = 'running', worker_id = ?, claimed_at = ?, started_at = ? WHERE id = ? AND status = 'queued'`
  ).bind(workerId, now, now, job.id).run()

  if (result.meta.changes === 1) {
    return c.json({ job: { id: job.id } })
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

export default app
