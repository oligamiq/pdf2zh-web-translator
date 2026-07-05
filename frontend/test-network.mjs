import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const urls = [];
  page.on('request', request => {
    urls.push(request.url());
  });

  await page.goto('http://localhost:5000/');
  await page.waitForLoadState('networkidle');
  
  console.log("--- NETWORK LOGS ---");
  urls.forEach(u => console.log(u));
  console.log("--- END NETWORK LOGS ---");

  await browser.close();
})();
