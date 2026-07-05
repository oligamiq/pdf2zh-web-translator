import { chromium } from '@playwright/test';
import fs from 'fs';

(async () => {
  console.log("Starting browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  console.log("Starting trace...");
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  
  const page = await context.newPage();
  
  // Also start Chrome DevTools Protocol session to get raw performance trace (for Forced Reflows)
  const client = await page.context().newCDPSession(page);
  await client.send('Tracing.start', {
    categories: '-*,devtools.timeline,v8.execute,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,toplevel,blink.console,blink.user_timing,latencyInfo,disabled-by-default-devtools.timeline.stack,disabled-by-default-v8.cpu_profiler',
    options: 'RecordUntilCustomEOF'
  });
  
  console.log("Navigating to http://127.0.0.1:8788");
  try {
    await page.goto('http://127.0.0.1:8788', { waitUntil: 'networkidle', timeout: 10000 });
  } catch (e) {
    console.log("Navigation timeout or error:", e.message);
  }
  
  console.log("Waiting a bit...");
  await page.waitForTimeout(2000);
  
  console.log("Stopping trace...");
  await context.tracing.stop({ path: 'trace-before.zip' });
  
  const traceData = await client.send('Tracing.end');
  const traceEvents = [];
  client.on('Tracing.dataCollected', event => {
    traceEvents.push(...event.value);
  });
  
  await new Promise(resolve => {
    client.on('Tracing.tracingComplete', () => {
      fs.writeFileSync('perf-trace-before.json', JSON.stringify({ traceEvents }));
      resolve();
    });
  });
  
  await browser.close();
  console.log("Done.");
})();
