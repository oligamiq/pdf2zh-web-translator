import { test, expect } from '@playwright/test';

test.describe('Settings UI', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    // Bypass auth via sessionStorage
    await page.addInitScript(() => {
      window.sessionStorage.setItem('e2e_token', 'mock_token');
      window.sessionStorage.setItem('e2e_user_email', 'e2e@example.com');
    });

    // Mock GET /jobs for dashboard
    await page.route('**/jobs', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
      route.fallback();
    });

    // Mock /healthz
    await page.route('**/healthz', async (route) => {
      return route.fulfill({ status: 200, body: 'ok' });
    });
  });

  test('should load settings and advanced settings', async ({ page }) => {
    // Mock GET /settings/api/basic
    await page.route('**/settings/api/basic', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            target_language: 'ja',
            has_api_key: false,
          }),
        });
      }
      route.fallback();
    });
    
    // Mock GET /settings/api/providers
    await page.route('**/settings/api/providers', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
      route.fallback();
    });

    await page.goto('/');
    
    // Go to Settings
    await page.click('a:has-text("Settings")');
    await expect(page).toHaveURL(/.*\/settings/);

    await expect(page.locator('h1', { hasText: 'Basic Settings' })).toBeVisible();

    // Go to Advanced
    await page.click('text=Advanced Routing');
    await expect(page).toHaveURL(/.*\/settings\/advanced/);
    await expect(page.locator('h1', { hasText: 'Advanced API Routing' })).toBeVisible();
    await expect(page.locator('text=No providers configured.')).toBeVisible();
  });
});
