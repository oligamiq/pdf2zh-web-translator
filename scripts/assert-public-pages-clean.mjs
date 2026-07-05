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

  let html = fs.readFileSync(filePath, 'utf-8');
  
  let head = html.split("</head>")[0] ?? "";

  // Remove <style>...</style> content to avoid false positives from inlined CSS
  head = head.replace(new RegExp('<style[^>]*>.*?</style>', 'gis'), '');

  // 1. Check head content
  for (const marker of prohibitedMarkers) {
    if (head.includes(marker)) {
      console.error(`ERROR: Forbidden app-only marker in <head>: ${marker} (${target})`);
      failed = true;
    }
  }

  // 2. Check direct script or link tags
  const directScriptOrPreloadMatches = html.match(
    /<(script|link)[^>]+(?:src|href)="[^"]+"[^>]*>/g
  ) ?? [];

  for (const tag of directScriptOrPreloadMatches) {
    for (const marker of ["firebase", "authState", "UploadForm", "JobList", "Dashboard"]) {
      if (tag.includes(marker)) {
        console.error(`ERROR: Forbidden app-only asset tag in ${target}: ${tag}`);
        failed = true;
      }
    }
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log("SUCCESS: No app-only markers found in public pages.");
}
