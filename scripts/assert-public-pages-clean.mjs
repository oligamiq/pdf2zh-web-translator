import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../frontend/dist');

if (!fs.existsSync(distPath)) {
  console.error(`ERROR: ${distPath} does not exist. Run build first.`);
  process.exit(1);
}

const targets = [
  'index.html',
  'about.html',
  'about/index.html',
  'licenses.html',
  'licenses/index.html'
];

const prohibitedMarkers = [
  'firebase',
  'turnstile',
  'UploadForm',
  'JobList',
  'Dashboard',
  'PDFファイルを選択',
  'apiFetch',
  'authState'
];

let failed = false;

for (const target of targets) {
  const filePath = path.join(distPath, target);
  if (!fs.existsSync(filePath)) {
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  
  // SolidStart injects window.manifest and modulepreloads for chunks.
  // We want to ignore these because they don't execute on the public LP.
  content = content.replace(/<script>window\.manifest\s*=\s*\{.*?\}<\/script>/g, '');
  content = content.replace(/<link[^>]*rel="modulepreload"[^>]*>/g, '');

  for (const marker of prohibitedMarkers) {
    if (content.includes(marker)) {
      console.error(`ERROR: Prohibited marker "${marker}" found in ${target}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log("SUCCESS: No app-only markers found in public pages.");
}
