import * as fs from 'fs';

let content = fs.readFileSync('src/index.ts', 'utf-8');

content = content.replace(/toBase64\(iv\)/, 'toBase64(iv.buffer)');
content = content.replace(/formData\.get\('pdf'\) as File/, "formData.get('pdf') as unknown as File");
content = content.replace(/const existing = await ensureUserProviders\(c\.env, uid\);/, 'const existing = (await ensureUserProviders(c.env, uid)) as any[];');
content = content.replace(/for \(const p of enabledProviders\) {/, 'for (const p of enabledProviders as any[]) {');
content = content.replace(/return c\.json\(\{ error: 'Private API error' \}, resp\.status\)/g, "return c.json({ error: 'Private API error' }, resp.status as any)");
content = content.replace(/const providers = await ensureUserProviders\(c\.env, uid\);/, 'const providers = (await ensureUserProviders(c.env, uid)) as any[];');

fs.writeFileSync('src/index.ts', content);
