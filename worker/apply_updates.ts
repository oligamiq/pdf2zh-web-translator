import * as fs from 'fs';

let content = fs.readFileSync('src/index.ts', 'utf-8');

// 1. GET /jobs
content = content.replace(
  /WHERE user_id = \? ORDER BY created_at DESC/,
  "WHERE user_id = ? AND deleted_at IS NULL AND created_at >= datetime('now', '-7 days') ORDER BY created_at DESC"
);

// 2. GET /jobs/:id
content = content.replace(
  /WHERE id = \? AND user_id = \?`\)\.bind\(id, uid\)/g,
  "WHERE id = ? AND user_id = ? AND deleted_at IS NULL`).bind(id, uid)"
);

// 3. GET /public/jobs/:id
content = content.replace(
  /WHERE id = \? AND owner_type = 'public' AND public_receipt_hash = \?`\)\.bind\(id, publicReceiptHash\)/g,
  "WHERE id = ? AND owner_type = 'public' AND public_receipt_hash = ? AND deleted_at IS NULL`).bind(id, publicReceiptHash)"
);

// 4. Update download routes
content = content.replace(
  /const resp = await fetchPrivateApi\(c\.env, `\/internal\/jobs\/\$\{id\}\/download`\)/g,
  `const type = c.req.query('type') || 'zip';\n  const filename = job.original_filename || 'translated';\n  const resp = await fetchPrivateApi(c.env, \`/internal/jobs/\${id}/download?filename=\${encodeURIComponent(filename as string)}&type=\${encodeURIComponent(type)}\`)`
);

// 5. Add DELETE /jobs/:id and DELETE /public/jobs/:id
const deleteRoutes = `
app.delete('/jobs/:id', authMiddleware, async (c) => {
  const uid = c.get('uid') as string;
  const id = c.req.param('id');
  await c.env.DB.prepare(\`UPDATE jobs SET deleted_at = datetime('now') WHERE id = ? AND user_id = ?\`).bind(id, uid).run();
  return c.json({ success: true });
});

app.delete('/public/jobs/:id', async (c) => {
  const id = c.req.param('id');
  const receipt = c.req.query('receipt');
  if (!receipt) return c.json({ error: 'Missing receipt' }, 403);
  
  const publicReceiptHash = await sha256Hex(receipt + (c.env.PUBLIC_RATE_LIMIT_SALT || 'salt'));
  await c.env.DB.prepare(\`UPDATE jobs SET deleted_at = datetime('now') WHERE id = ? AND owner_type = 'public' AND public_receipt_hash = ?\`).bind(id, publicReceiptHash).run();
  return c.json({ success: true });
});
`;

content = content.replace(/app\.get\('\/jobs', authMiddleware, async \(c\) => \{/, deleteRoutes + '\napp.get(\'/jobs\', authMiddleware, async (c) => {');

// 6. Add GET /health/pc-api
const pcApiHealth = `
app.get('/health/pc-api', async (c) => {
  try {
    let resp;
    if (c.env.PC_API_VPC) {
      resp = await c.env.PC_API_VPC.fetch("http://pc-api:8081/internal/healthz", {
        headers: { "X-Proxy-Secret": c.env.PROXY_SECRET },
        signal: AbortSignal.timeout(2000)
      });
    } else {
      resp = await fetchPrivateApi(c.env, '/internal/healthz', { signal: AbortSignal.timeout(2000) });
    }
    if (resp.ok) {
      return c.json({ ok: true, status: 'online' });
    } else {
      return c.json({ ok: false, status: 'offline', message: "PC conversion server is not reachable" });
    }
  } catch (err) {
    return c.json({ ok: false, status: 'offline', message: "PC conversion server is not reachable" });
  }
});
`;

content = content.replace(/app\.get\('\/healthz', \(c\) => \{/, pcApiHealth + '\napp.get(\'/healthz\', (c) => {');

fs.writeFileSync('src/index.ts', content);
