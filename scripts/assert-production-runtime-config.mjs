import fs from 'node:fs';
import path from 'node:path';

const distPath = fs.existsSync('frontend/dist') ? 'frontend/dist' : 'dist';
const expectedApiBase = process.env.EXPECTED_API_BASE_URL || 'https://pdftr.oligami.workers.dev';
const testTurnstileKey = '1x00000000000000000000AA';

function collectFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(full);
    return /\.(?:js|html)$/.test(entry.name) ? [full] : [];
  });
}

if (!fs.existsSync(distPath)) {
  console.error(`ERROR: ${distPath} does not exist. Run build first.`);
  process.exit(1);
}

const files = collectFiles(distPath);
const contents = files.map((file) => fs.readFileSync(file, 'utf8'));

if (!contents.some((text) => text.includes(expectedApiBase))) {
  console.error(`ERROR: production API base is missing from built frontend: ${expectedApiBase}`);
  process.exit(1);
}

if (contents.some((text) => text.includes(testTurnstileKey))) {
  console.error('ERROR: Cloudflare Turnstile test site key is present in production frontend.');
  process.exit(1);
}

console.log(`SUCCESS: production runtime config points to ${expectedApiBase} and does not use the Turnstile test key.`);
