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

  // --- Full PDF translation pipeline ---
  console.log('1. Testing full PDF translation pipeline with siliconflow_free...');
  const MOCK_PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj 4 0 obj<</Length 21>>stream\nBT /F1 24 Tf 100 700 Td (Smoke Test) Tj ET\nendstream\nendobj xref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000109 00000 n\n0000000204 00000 n\ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n275\n%%EOF');

  const formData = new FormData();
  formData.append('pdf', new Blob([MOCK_PDF], { type: 'application/pdf' }), 'smoke-test.pdf');

  let jobId, receipt;
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
      console.error(`   ❌ Failed to create smoke job (HTTP ${resp.status}): ${text}`);
      process.exit(1);
    }

    const data = await resp.json();
    jobId = data.id;
    receipt = data.receipt;
    console.log(`   ✅ Created smoke job: ${jobId}`);
  } catch (err) {
    console.error(`   ❌ Failed to create smoke job: ${err.message}`);
    process.exit(1);
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

      const data = await resp.json();
      jobStatus = data.job.status;
      const progress = data.job.progress_percent || 0;
      process.stdout.write(`\r      Status: ${jobStatus} (${progress}%)     `);
    } catch (err) {
      // ignore transient errors
    }
  }
  console.log(''); // newline after polling

  if (jobStatus === 'failed') {
    // Fetch logs securely without printing them entirely
    const resp = await fetch(`${WORKER_URL}/public/jobs/${jobId}?receipt=${receipt}`);
    const data = await resp.json();
    console.error('   ❌ Job failed! [pipeline_failed]');
    console.error(`      Error: ${data.job?.error_message || 'Unknown'}`);
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
