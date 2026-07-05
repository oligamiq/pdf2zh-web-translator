import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.route('**', route => route.continue()); // Disable cache visually
  
  const urlsInit = [];
  const urlsLogin = [];
  let capturingLogin = false;

  page.on('request', request => {
    if (capturingLogin) urlsLogin.push(request.url());
    else urlsInit.push(request.url());
  });

  await page.goto('http://127.0.0.1:3003/');
  await page.waitForLoadState('networkidle');
  
  console.log("--- INITIAL LOAD ---");
  urlsInit.forEach(u => console.log(u));
  
  capturingLogin = true;
  await page.click('[data-testid="guest-auth-button"]');
  await page.waitForTimeout(3000);

  console.log("--- LOGIN CLICK ---");
  urlsLogin.forEach(u => console.log(u));

  await browser.close();
})();
