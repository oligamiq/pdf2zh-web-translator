import { test, expect } from '@playwright/test';
import { setupDefaultApiMocks, setupApiGuard } from './helpers/api';

test('Take mobile screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setupApiGuard(page);
  await setupDefaultApiMocks(page);

  await page.route('**/limits', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        scope: 'public',
        pdf_max_bytes: 5 * 1024 * 1024,
        jobs_per_day: 3,
        jobs_used_today: 0,
        jobs_remaining_today: 3,
        retention_days: 1,
        public_job_expiry_hours: 24
      }),
    });
  });

  await page.goto('/app');
  await expect(page.locator('.guest-limit-details')).toBeVisible();
  await page.locator('.guest-limit-details summary').click();
  await page.waitForTimeout(500);
  await page.locator('.upload-card').screenshot({ path: '/home/oligami/.gemini/antigravity-cli/brain/96a0278d-82bb-40a4-8b50-d411d0bd43ed/mobile-guest-limits.png' });
});
