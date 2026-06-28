import { test, expect } from '@playwright/test';
import { setupDefaultApiMocks, setupApiGuard } from './helpers/api';

test.describe('Usage limits', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiGuard(page);
    await setupDefaultApiMocks(page);
  });

  test('About page is accessible', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('h1')).toHaveText('利用制限と注意事項');
    await expect(page.locator('text=このサイトについて')).toBeVisible();
  });

  test('Guest limits are displayed on upload form', async ({ page }) => {
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
    
    // Mock Turnstile to avoid hanging
    await page.addInitScript(() => {
      // @ts-ignore
      window.turnstile = {
        render: () => 'widget-id',
        reset: () => {},
      };
    });

    await page.goto('/');
    // Check for limit text
    // The component has "Guest Mode" or "Logged-in Mode" text when limits are loaded
    await expect(page.locator('summary', { hasText: 'ゲスト利用' })).toBeVisible();
    await expect(page.locator('summary', { hasText: '5 MiB' })).toBeVisible();
    await expect(page.locator('summary', { hasText: '1日3件' })).toBeVisible();
  });
});
