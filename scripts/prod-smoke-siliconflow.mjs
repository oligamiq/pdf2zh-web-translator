#!/usr/bin/env node
// Production smoke test: SiliconFlow Free provider connectivity
//
// Usage:
//   PROD_SMOKE_TOKEN=<secret> node scripts/prod-smoke-siliconflow.mjs
//   PROD_SMOKE_TOKEN=<secret> PROD_WORKER_URL=https://pdftr.oligami.workers.dev node scripts/prod-smoke-siliconflow.mjs
//
// Environment variables:
//   PROD_SMOKE_TOKEN  (required) - The smoke endpoint auth token
//   PROD_WORKER_URL   (optional) - Worker base URL (default: https://pdftr.oligami.workers.dev)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKER_URL = process.env.PROD_WORKER_URL || 'https://pdftr.oligami.workers.dev';
const SMOKE_TOKEN = process.env.PROD_SMOKE_TOKEN;

if (!SMOKE_TOKEN) {
  console.error('❌ PROD_SMOKE_TOKEN environment variable is required');
  process.exit(1);
}

async function main() {
  console.log(`🔍 Production Smoke Test: SiliconFlow`);
  console.log(`   Worker: ${WORKER_URL}`);
  console.log('');

  // --- Check Backend Health ---
  console.log('1. Checking backend health...');
  try {
    const healthResp = await fetch(`${WORKER_URL}/health/pc-api`);
    const healthData = await healthResp.json();
    if (!healthResp.ok || !healthData.ok) {
      console.error(`   ❌ Backend container is offline or unreachable:`, healthData);
      process.exit(1);
    }
    console.log(`   ✅ Backend health ok`);
  } catch (err) {
    console.error(`   ❌ Failed to check backend health: ${err.message}`);
    process.exit(1);
  }
  console.log('');

  // --- Full PDF translation pipeline ---
  console.log('2. Testing full PDF translation pipeline with siliconflow_free...');
  const fixturePath = path.join(__dirname, 'fixtures', 'smoke-paragraph.pdf');
  const MOCK_PDF = fs.readFileSync(fixturePath);

  const formData = new FormData();
  formData.append('pdf', new Blob([MOCK_PDF], { type: 'application/pdf' }), 'smoke-test.pdf');

  let jobId, receipt;
  let retries = 3;
  while (retries > 0) {
    try {
      const resp = await fetch(`${WORKER_URL}/internal/smoke/job`, {
        method: 'POST',
        headers: {
          'X-Smoke-Token': SMOKE_TOKEN,
        },
        body: formData,
      });

      if (!resp.ok) {
        const text = await resp.text();
        if (resp.status === 500 && retries > 1) {
          console.warn(`   ⚠️ Failed to create smoke job (HTTP 500). Retrying... (${text})`);
          retries--;
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        }
        console.error(`   ❌ Failed to create smoke job (HTTP ${resp.status}): ${text}`);
        process.exit(1);
      }

      const data = await resp.json();
      jobId = data.id;
      receipt = data.receipt;
      console.log(`   ✅ Created smoke job: ${jobId}`);
      break;
    } catch (err) {
      if (retries > 1) {
        console.warn(`   ⚠️ Error creating smoke job. Retrying... (${err.message})`);
        retries--;
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }
      console.error(`   ❌ Failed to create smoke job: ${err.message}`);
      process.exit(1);
    }
  }

  // Poll until completion
  console.log('   Polling job status...');
  let jobStatus = 'queued';
  let pollCount = 0;
  while (jobStatus !== 'completed' && jobStatus !== 'failed') {
    pollCount++;
    if (pollCount > 60) { // 60 * 5s = 5 minutes timeout
      console.error('   ❌ Job timed out (5 minutes)');
      process.exit(1);
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      const resp = await fetch(`${WORKER_URL}/public/jobs/${jobId}?receipt=${receipt}`);
      if (!resp.ok) continue;

      const job = await resp.json();
      jobStatus = job.status;
      const progress = job.progress_percent || 0;
      
      console.log(`\n--- Job Polling Update ---`);
      console.log(`Job ID: ${job.id}`);
      console.log(`Status: ${job.status} (${progress}%)`);
      console.log(`Updated At: ${job.updated_at}`);
      if (job.error_code) console.log(`Error Code: ${job.error_code}`);
      if (job.progress_phase) console.log(`Phase: ${job.progress_phase}`);
      if (job.log_tail) {
        console.log(`Safe Log Tail:`);
        job.log_tail.split('\n').forEach(line => {
          const lower = line.toLowerCase();
          if (!lower.includes('receipt') && !lower.includes('token') && !lower.includes('sk-') && !lower.includes('%pdf')) {
            console.log(`  ${line}`);
          }
        });
      }
    } catch (err) {
      // ignore transient errors
    }
  }
  console.log(''); // newline after polling

  if (jobStatus === 'failed') {
    // Fetch logs securely without printing them entirely
    const resp = await fetch(`${WORKER_URL}/public/jobs/${jobId}?receipt=${receipt}`);
    const job = await resp.json();
    let errCode = 'pipeline_failed';
    const errorMsg = job.error_message || 'Unknown';
    if (errorMsg.includes('no paragraphs')) {
      errCode = 'pdf_parse_no_paragraphs';
    } else if (errorMsg.includes('Babeldoc translation error')) {
      errCode = 'babeldoc_parse_failed';
    } else if (errorMsg.includes('siliconflow')) {
      errCode = 'pdf2zh_siliconflowfree_failed';
    }

    console.error(`   ❌ Job failed! [${errCode}]`);
    console.error(`      Error: ${errorMsg}`);
    if (job.log_tail) {
      console.log(`      Safe Log Tail:`);
      job.log_tail.split('\n').forEach(line => {
        const lower = line.toLowerCase();
        if (!lower.includes('receipt') && !lower.includes('token') && !lower.includes('sk-') && !lower.includes('%pdf')) {
          console.log(`        ${line}`);
        }
      });
    }
    process.exit(1);
  }

  console.log('   ✅ Job completed successfully');

  // Verify downloads
  console.log('   Verifying downloads...');
  for (const type of ['translated', 'bilingual']) {
    try {
      const resp = await fetch(`${WORKER_URL}/jobs/${jobId}/files/${type}.pdf?receipt=${receipt}`);
      if (!resp.ok || resp.headers.get('content-type') !== 'application/pdf') {
        console.error(`   ❌ Failed to download ${type} PDF [pdf_download_failed]`);
        process.exit(1);
      }
      console.log(`      ✅ ${type}.pdf is accessible (Content-Type: ${resp.headers.get('content-type')})`);
    } catch (err) {
      console.error(`   ❌ Failed to download ${type} PDF [pdf_download_failed]`);
      process.exit(1);
    }
  }

  console.log('   Cleaning up smoke job...');
  try {
    const resp = await fetch(`${WORKER_URL}/public/jobs/${jobId}?receipt=${receipt}`, { method: 'DELETE' });
    if (!resp.ok) {
      console.warn(`   ⚠️ Failed to delete smoke job (HTTP ${resp.status})`);
    } else {
      console.log('      ✅ Job deleted');
    }
  } catch (err) {
    console.warn(`   ⚠️ Failed to delete smoke job`);
  }

  console.log('');
  console.log('🎉 Production smoke test passed');
}

main().catch(err => {
  console.error(`❌ Unexpected error [unknown]`);
  process.exit(1);
});
