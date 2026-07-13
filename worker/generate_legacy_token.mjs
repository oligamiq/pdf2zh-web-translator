import fs from 'fs';
import crypto from 'crypto';

const envFile = fs.readFileSync('.dev.vars', 'utf8');
let salt = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('PUBLIC_RATE_LIMIT_SALT=')) {
    salt = line.split('=')[1].trim();
    if (salt.startsWith('"') && salt.endsWith('"')) {
      salt = salt.slice(1, -1);
    }
  }
}

const jobId = '9f742031-b906-4ca5-b533-492ac334b091';

function generateLegacyToken(id) {
  return crypto.createHash('sha256').update(id + salt).digest('hex');
}

console.log(generateLegacyToken(jobId));
