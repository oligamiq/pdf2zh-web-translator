const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // 1. Dashboard (UploadForm)
  await page.goto('http://127.0.0.1:3000/');
  await page.waitForLoadState('networkidle');
  // Click guest login
  const guestBtn = await page.$('[data-testid="guest-auth-button"]');
  if (guestBtn) {
    await guestBtn.click();
    await page.waitForTimeout(500);
  }
  
  console.log("=== Dashboard ===");
  const headings = await page.evaluate(() => Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => `${h.tagName}: ${h.textContent.trim()}`));
  console.log("Headings:", headings);
  
  const mains = await page.evaluate(() => document.querySelectorAll('main').length);
  console.log("Main elements count:", mains);
  
  const labels = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('select, input')).map(el => {
      const id = el.id;
      const ariaLabel = el.getAttribute('aria-label');
      const type = el.tagName === 'INPUT' ? el.type : el.tagName.toLowerCase();
      const parentLabel = el.closest('label');
      const forLabel = id ? document.querySelector(`label[for="${id}"]`) : null;
      return `<${type}> -> id: ${id}, aria-label: ${ariaLabel}, has for label: ${!!forLabel}`;
    });
  });
  console.log("Inputs/Selects:", labels);

  // 2. Settings
  await page.goto('http://127.0.0.1:3000/settings');
  await page.waitForLoadState('networkidle');
  console.log("\n=== Settings ===");
  const settingsHeadings = await page.evaluate(() => Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => `${h.tagName}: ${h.textContent.trim()}`));
  console.log("Headings:", settingsHeadings);

  const settingsLabels = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('select, input')).map(el => {
      const id = el.id;
      const type = el.tagName === 'INPUT' ? el.type : el.tagName.toLowerCase();
      const forLabel = id ? document.querySelector(`label[for="${id}"]`) : null;
      return `<${type}> -> id: ${id}, has for label: ${!!forLabel}`;
    });
  });
  console.log("Inputs/Selects:", settingsLabels);

  // 3. Advanced Settings
  await page.goto('http://127.0.0.1:3000/settings/advanced');
  await page.waitForLoadState('networkidle');
  // Click add provider to show form
  const addBtn = await page.$('[data-testid="add-provider-button"]');
  if (addBtn) {
    await addBtn.click();
    await page.waitForTimeout(500);
  }
  console.log("\n=== Advanced Settings ===");
  const advHeadings = await page.evaluate(() => Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => `${h.tagName}: ${h.textContent.trim()}`));
  console.log("Headings:", advHeadings);

  const advLabels = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('select, input')).map(el => {
      const id = el.id;
      const type = el.tagName === 'INPUT' ? el.type : el.tagName.toLowerCase();
      const forLabel = id ? document.querySelector(`label[for="${id}"]`) : null;
      return `<${type}> -> id: ${id}, has for label: ${!!forLabel}`;
    });
  });
  console.log("Inputs/Selects:", advLabels);
  
  await browser.close();
})();
