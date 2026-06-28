import { test, expect } from '@playwright/test';

test.describe('Usage limits', () => {
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
    await expect(page.locator('text=ゲスト利用').first()).toBeVisible();
    await expect(page.locator('text=5 MiBまで').first()).toBeVisible();
    await expect(page.locator('text=1日3件まで').first()).toBeVisible();
  });
});
