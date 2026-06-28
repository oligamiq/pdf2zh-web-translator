const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  await page.addInitScript(() => {
    window.sessionStorage.setItem('e2e_token', 'mock-valid-token');
    window.sessionStorage.setItem('e2e_user_email', 'user@example.com');
  });

  await page.goto('https://pdftr.pages.dev', { waitUntil: 'domcontentloaded' });

  // Wait a bit for render
  await page.waitForTimeout(2000);

  const results = await page.evaluate(() => {
    const label = document.querySelector('.account-menu-label');
    const avatar = document.querySelector('.account-avatar');
    const btn = document.querySelector('.account-menu-button');
    return {
      innerWidth: window.innerWidth,
      labelDisplay: label ? window.getComputedStyle(label).display : 'null',
      avatarDisplay: avatar ? window.getComputedStyle(avatar).display : 'null',
      btnWidth: btn ? window.getComputedStyle(btn).width : 'null',
      btnInnerText: btn ? btn.innerText : 'null',
      btnTextContent: btn ? btn.textContent : 'null',
      btnBoundingBox: btn ? btn.getBoundingClientRect() : null
    };
  });

  console.log(JSON.stringify(results, null, 2));

  await page.screenshot({ path: 'test-results/prod-mobile-header.png' });
  await browser.close();
})();
