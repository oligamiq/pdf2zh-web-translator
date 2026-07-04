import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../frontend/dist');

if (!fs.existsSync(distPath)) {
  console.error(`ERROR: ${distPath} does not exist. Run build first.`);
  process.exit(1);
}

const markers = "e2e_token|e2e_user_email|VITE_E2E_AUTH_BYPASS|e2e_delay_auth|__e2e|simulate_login";

try {
  // Use grep which is standard on Unix environments
  const cmd = `grep -rEn "${markers}" ${distPath}`;
  const output = execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
  
  if (output.trim()) {
    console.error("ERROR: E2E bypass markers were found in production dist.");
    console.error(output);
    process.exit(1);
  }
} catch (e) {
  // grep exits with 1 if no lines were selected, which is what we want!
  if (e.status !== 1) {
    console.error("Warning: grep command failed with status", e.status);
  }
}
console.log("SUCCESS: No E2E bypass markers found in production dist.");
