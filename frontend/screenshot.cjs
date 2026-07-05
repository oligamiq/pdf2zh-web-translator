const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 2000 } });
  await page.goto('file:///home/oligami/.gemini/antigravity-cli/brain/96a0278d-82bb-40a4-8b50-d411d0bd43ed/lh-report.html');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/oligami/.gemini/antigravity-cli/brain/96a0278d-82bb-40a4-8b50-d411d0bd43ed/lighthouse_screenshot.png', fullPage: true });
  await browser.close();
})();
