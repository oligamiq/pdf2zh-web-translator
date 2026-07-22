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

function writeSummary(content) {
  fs.appendFileSync('smoke-summary.md', content + '\n');
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, content + '\n');
  }
}

function cleanLogTail(logTail) {
  if (!logTail) return '';
  const lines = logTail.split('\n');
  const safeLines = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (!lower.includes('receipt') && !lower.includes('token') && !lower.includes('sk-') && !lower.includes('%pdf')) {
      safeLines.push(line);
    }
  }
  return safeLines.join('\n');
}

if (!SMOKE_TOKEN) {
  console.error('❌ PROD_SMOKE_TOKEN environment variable is required');
  writeSummary('## ❌ Smoke Test Failed: missing_smoke_token\nPROD_SMOKE_TOKEN environment variable is missing.');
  process.exit(1);
}

async function main() {
  console.log(`🔍 Production Smoke Test: SiliconFlow`);
  console.log(`   Worker: ${WORKER_URL}\n`);

  let summary = '## Production Smoke Test: SiliconFlow\n\n';

  // --- Check Backend Health ---
  console.log('1. Checking backend health...');
  try {
    const healthResp = await fetch(`${WORKER_URL}/health/pc-api`);
    const healthData = await healthResp.json();
    if (!healthResp.ok || !healthData.ok) {
      console.error(`   ❌ Backend container is offline or unreachable [backend_health_failed]:`, healthData);
      writeSummary(summary + `### ❌ Failed: backend_health_failed\nHTTP Status: ${healthResp.status}\nNext action: Check if pc-api container is running and healthy on the host.`);
      process.exit(1);
    }
    console.log(`   ✅ Backend health ok`);
    summary += '- ✅ backend health ok\n';
  } catch (err) {
    console.error(`   ❌ Failed to check backend health [backend_health_failed]: ${err.message}`);
    writeSummary(summary + `### ❌ Failed: backend_health_failed\nError: ${err.message}\nNext action: Check if pc-api container is running and healthy on the host.`);
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
        headers: { 'X-Smoke-Token': SMOKE_TOKEN },
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
        const errCode = text.includes('D1') ? 'd1_timeout' : 'smoke_job_create_failed';
        console.error(`   ❌ Failed to create smoke job (HTTP ${resp.status}) [${errCode}]: ${text}`);
        writeSummary(summary + `### ❌ Failed: ${errCode}\nHTTP Status: ${resp.status}\nNext action: Check worker logs or D1 database status.`);
        process.exit(1);
      }

      const data = await resp.json();
      jobId = data.id;
      receipt = data.receipt;
      console.log(`   ✅ Created smoke job: ${jobId}`);
      summary += '- ✅ smoke job created\n';
      break;
    } catch (err) {
      if (retries > 1) {
        console.warn(`   ⚠️ Error creating smoke job. Retrying... (${err.message})`);
        retries--;
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }
      console.error(`   ❌ Failed to create smoke job [smoke_job_create_failed]: ${err.message}`);
      writeSummary(summary + `### ❌ Failed: smoke_job_create_failed\nError: ${err.message}\nNext action: Check worker network connectivity.`);
      process.exit(1);
    }
  }

  // Poll until completion
  console.log('   Polling job status...');
  let jobStatus = 'queued';
  let pollCount = 0;
  let lastJobData = null;
  while (jobStatus !== 'completed' && jobStatus !== 'failed') {
    pollCount++;
    if (pollCount > 60) { // 60 * 5s = 5 minutes timeout
      console.error('   ❌ Job timed out (5 minutes) [job_timeout]');
      summary += `\n### ❌ Failed: job_timeout\n`;
      summary += `- **Job ID**: ${jobId}\n`;
      if (lastJobData) {
        summary += `- **Last Status**: ${lastJobData.status} (${lastJobData.progress_percent || 0}%)\n`;
        summary += `- **Last Phase**: ${lastJobData.progress_phase || 'unknown'}\n`;
        summary += `- **Updated At**: ${lastJobData.updated_at}\n`;
      }
      summary += `\nNext action: Check pc-api python logs to see why it stalled.`;
      writeSummary(summary);
      process.exit(1);
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      const resp = await fetch(`${WORKER_URL}/public/jobs/${jobId}?receipt=${receipt}`);
      if (!resp.ok) continue;

      lastJobData = await resp.json();
      jobStatus = lastJobData.status;
      const progress = lastJobData.progress_percent || 0;
      
      console.log(`\n--- Job Polling Update ---`);
      console.log(`Job ID: ${lastJobData.id}`);
      console.log(`Status: ${lastJobData.status} (${progress}%)`);
      console.log(`Updated At: ${lastJobData.updated_at}`);
      if (lastJobData.error_code) console.log(`Error Code: ${lastJobData.error_code}`);
      if (lastJobData.progress_phase) console.log(`Phase: ${lastJobData.progress_phase}`);
      if (lastJobData.log_tail) {
        console.log(`Safe Log Tail:`);
        console.log(cleanLogTail(lastJobData.log_tail).replace(/^/gm, '  '));
      }
    } catch (err) {
      // ignore transient errors
    }
  }
  console.log('');

  if (jobStatus === 'failed') {
    let errCode = 'job_failed';
    const errorMsg = lastJobData.error_message || 'Unknown';
    if (errorMsg.includes('no paragraphs')) {
      errCode = 'pdf_parse_no_paragraphs';
    } else if (errorMsg.includes('Babeldoc translation error')) {
      errCode = 'babeldoc_parse_failed';
    } else if (errorMsg.includes('siliconflow')) {
      errCode = 'pdf2zh_siliconflowfree_failed';
    }

    console.error(`   ❌ Job failed! [${errCode}]`);
    console.error(`      Error: ${errorMsg}`);
    
    summary += `\n### ❌ Failed: ${errCode}\n`;
    summary += `- **Job ID**: ${jobId}\n`;
    summary += `- **Failed Phase**: ${lastJobData.progress_phase || 'unknown'}\n`;
    if (lastJobData.error_code) summary += `- **Error Code**: ${lastJobData.error_code}\n`;
    summary += `- **Error Message**: ${errorMsg.substring(0, 100)}\n`;
    summary += `\n**Safe Log Tail**:\n\`\`\`\n${cleanLogTail(lastJobData.log_tail)}\n\`\`\`\n`;
    summary += `\nNext action: Check the backend logs for detailed stack trace.`;
    
    writeSummary(summary);
    process.exit(1);
  }

  console.log('   ✅ Job completed successfully');
  summary += '- ✅ job completed\n';
  
  console.log('   Verifying job execution metadata (provider/engine/routing)...');
  const verifyResp = await fetch(`${WORKER_URL}/public/jobs/${jobId}?receipt=${receipt}`);
  const jobResult = await verifyResp.json();
  const metadata = jobResult.execution_metadata || {};
  
  const requiredMetadata = {
    route: 'pdf2zh_native',
    router_used: false,
    provider: 'siliconflow_free',
    engine: 'SiliconFlowFree'
  };
  
  const expectedSha = process.env.EXPECTED_GIT_SHA || '';
  if (expectedSha) {
    requiredMetadata.backend_git_sha = expectedSha;
  }
  
  const missingLogs = [];
  for (const [key, value] of Object.entries(requiredMetadata)) {
    if (metadata[key] !== value) {
      missingLogs.push(`Expected ${key}=${value}, got ${metadata[key]}`);
    }
  }

  if (missingLogs.length > 0) {
    console.error(`   ❌ Verification failed: execution_metadata mismatch [route_assert_failed]`);
    missingLogs.forEach(m => console.error(`      - ${m}`));
    
    summary += `\n### ❌ Failed: route_assert_failed\n`;
    summary += `The following execution_metadata values mismatched:\n`;
    missingLogs.forEach(m => summary += `- \`${m}\`\n`);
    summary += `\n**Safe Log Tail**:\n\`\`\`\n${cleanLogTail(jobResult.log_tail || '')}\n\`\`\`\n`;
    summary += `\nNext action: Verify pc-api-python route logging logic.`;
    writeSummary(summary);
    process.exit(1);
  }
  
  console.log('      ✅ Execution metadata verification passed');
  summary += '- ✅ execution_metadata route assert ok\n';

  // Verify downloads
  console.log('   Verifying downloads...');
  let downloadOk = true;
  for (const type of ['translated', 'bilingual']) {
    try {
      const resp = await fetch(`${WORKER_URL}/jobs/${jobId}/files/${type}.pdf?receipt=${receipt}`);
      if (!resp.ok || resp.headers.get('content-type') !== 'application/pdf') {
        console.error(`   ❌ Failed to download ${type} PDF [pdf_download_failed]`);
        summary += `\n### ❌ Failed: pdf_download_failed\n`;
        summary += `Could not download ${type}.pdf. HTTP Status: ${resp.status}\n`;
        summary += `\nNext action: Check if R2 upload succeeded during job completion.`;
        downloadOk = false;
        break;
      }
      console.log(`      ✅ ${type}.pdf is accessible`);
      summary += `- ✅ ${type} PDF ok\n`;
    } catch (err) {
      console.error(`   ❌ Failed to download ${type} PDF: ${err.message}`);
      summary += `\n### ❌ Failed: pdf_download_failed\nError: ${err.message}\n`;
      downloadOk = false;
      break;
    }
  }

  if (!downloadOk) {
    writeSummary(summary);
    process.exit(1);
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
  summary += '\n🎉 **All checks passed successfully!**';
  writeSummary(summary);
}

main().catch(err => {
  console.error(`❌ Unexpected error [unknown]`, err);
  writeSummary(`## ❌ Smoke Test Failed: unknown_error\nError: ${err.message}\nCheck logs for details.`);
  process.exit(1);
});

