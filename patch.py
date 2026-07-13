import re

with open('worker/src/index.ts', 'r') as f:
    content = f.read()

helper = """
async function getPublicJobWithLegacyFallback(env: Env, id: string, receipt: string, selectFields: string) {
  const publicReceiptHash = await hmacSha256Hex(env.RECEIPT_SIGNING_SECRET || 'secret', receipt);
  let job = await env.DB.prepare(`SELECT ${selectFields} FROM jobs WHERE id = ? AND owner_type = 'public' AND public_receipt_hash = ? AND deleted_at IS NULL`).bind(id, publicReceiptHash).first();
  let isLegacyFallback = false;
  let usedHash = publicReceiptHash;

  if (!job) {
    const legacyPublicReceiptHash = await sha256Hex(receipt + (env.PUBLIC_RATE_LIMIT_SALT || 'salt'));
    const legacyJob = await env.DB.prepare(`SELECT ${selectFields} FROM jobs WHERE id = ? AND owner_type = 'public' AND public_receipt_hash = ? AND deleted_at IS NULL`).bind(id, legacyPublicReceiptHash).first();
    
    if (legacyJob && (legacyJob.created_at as string) < '2026-07-06T00:00:00.000Z') {
      const compatUntil = env.LEGACY_PDF_TOKEN_COMPAT_UNTIL ? new Date(env.LEGACY_PDF_TOKEN_COMPAT_UNTIL).getTime() : Infinity;
      if (Date.now() < compatUntil) {
         job = legacyJob;
         isLegacyFallback = true;
         usedHash = legacyPublicReceiptHash;
      }
    }
  }

  if (isLegacyFallback && job) {
    console.log(JSON.stringify({
      job_id: id,
      auth_result: 'legacy_token_accepted',
      token_version: 'legacy-sha256',
      created_at: job.created_at,
      download_expires_at: job.download_expires_at
    }));
  }

  return { job, usedHash };
}

app.get('/public/jobs/:id',"""

content = content.replace("app.get('/public/jobs/:id',", helper)

# Now replace the query logic inside each public endpoint
# /public/jobs/:id
content = re.sub(
    r"const publicReceiptHash = await hmacSha256Hex\(c\.env\.RECEIPT_SIGNING_SECRET \|\| 'secret', receipt\)\s*const job = await c\.env\.DB\.prepare\(`SELECT (.*?) FROM jobs WHERE id = \? AND owner_type = 'public' AND public_receipt_hash = \? AND deleted_at IS NULL`\)\.bind\(id, publicReceiptHash\)\.first\(\)",
    r"const { job } = await getPublicJobWithLegacyFallback(c.env, id, receipt, '\1')",
    content
)

# And for DELETE
content = content.replace(
    """  const publicReceiptHash = await hmacSha256Hex(c.env.RECEIPT_SIGNING_SECRET || 'secret', receipt);
  await c.env.DB.prepare(`UPDATE jobs SET deleted_at = datetime('now') WHERE id = ? AND owner_type = 'public' AND public_receipt_hash = ?`).bind(id, publicReceiptHash).run();""",
    """  const { job, usedHash } = await getPublicJobWithLegacyFallback(c.env, id, receipt, 'id, created_at, download_expires_at');
  if (!job) return c.json({ error: 'Missing receipt' }, 403);
  await c.env.DB.prepare(`UPDATE jobs SET deleted_at = datetime('now') WHERE id = ? AND owner_type = 'public' AND public_receipt_hash = ?`).bind(id, usedHash).run();"""
)


with open('worker/src/index.ts', 'w') as f:
    f.write(content)

