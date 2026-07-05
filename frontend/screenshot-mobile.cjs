const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  
  // Mock API for limits to ensure it renders instantly
  await page.route('**/api/limits', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        scope: "public",
        pdf_max_bytes: 5242880,
        jobs_per_day: 3,
        public_job_expiry_hours: 24
      })
    });
  });
  // Also mock auth
  await page.route('**/api/auth/me', async route => {
    await route.fulfill({ status: 401 });
  });

  await page.goto('http://127.0.0.1:3000/');
  
  await page.waitForSelector('.guest-limit-details', { state: 'attached', timeout: 5000 });
  await page.click('.guest-limit-details summary');
  await page.waitForTimeout(500);
  
  await page.locator('.upload-card').screenshot({ path: '/home/oligami/.gemini/antigravity-cli/brain/96a0278d-82bb-40a4-8b50-d411d0bd43ed/mobile-guest-limits.png' });
  
  await browser.close();
})();
