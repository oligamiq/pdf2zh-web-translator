import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser } from './helpers/auth';
import { setupDefaultApiMocks, setupApiGuard } from './helpers/api';

test.describe('UX Improvements', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiGuard(page);
    await setupDefaultApiMocks(page);
    await setupAuthenticatedUser(page);

    await page.route('**/health/pc-api', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true, status: 'online' }) });
    });
  });

  test('should display job list with new actions, health badge, and 7-day note', async ({ page }) => {
    await page.route('**/jobs', async route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'job-1',
            status: 'completed',
            original_filename: 'very_long_filename_that_should_be_truncated.pdf',
            created_at: new Date().toISOString(),
          },
          {
            id: 'job-2',
            status: 'running',
            original_filename: 'running.pdf',
            created_at: new Date().toISOString(),
          }
        ]),
      });
    });

    await page.goto('/');

    // Check health badge
    await expect(page.getByText('server: online')).toBeVisible();

    // Check 7-day note
    await expect(page.getByTestId('retention-note')).toBeVisible();

    // Check completed job actions
    const job1Row = page.getByTestId('job-row').filter({ hasText: 'very_long_filename_that_should_be_truncated.pdf' });
    await expect(job1Row.getByRole('button', { name: 'PDFを表示' })).toBeVisible();
    await expect(job1Row.getByRole('link', { name: '詳細' })).toBeVisible();
    await expect(job1Row.getByRole('button', { name: '削除' })).toBeVisible();

    // Check running job actions
    const job2Row = page.getByTestId('job-row').filter({ hasText: 'running.pdf' });
    await expect(job2Row.getByRole('button', { name: 'PDFを表示' })).toBeHidden();
    await expect(job2Row.getByRole('link', { name: '詳細' })).toBeVisible();
    await expect(job2Row.getByRole('button', { name: '削除' })).toBeVisible();

    // Test Open PDF correctly opens the dual URL
    // Since window.open opens a new tab, we mock getDownloadUrl or intercept
    await page.route('**/jobs/*/download**', async route => {
      return route.fulfill({ status: 200, body: 'mock-pdf' });
    });
    
    // Test Details link
    await expect(job1Row.getByRole('link', { name: '詳細' })).toHaveAttribute('href', '/jobs/job-1');

    // Test Delete confirmation
    page.on('dialog', dialog => dialog.accept());
    await page.route('**/jobs/job-1', async route => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 200, body: '{}' });
      }
    });
    await job1Row.getByRole('button', { name: '削除' }).click();
  });

  test('should parse API test errors correctly and remove Default URL text', async ({ page }) => {
    await page.route('**/settings/api/basic', async route => {
      return route.fulfill({ status: 200, body: JSON.stringify({ target_language: 'ja', has_api_key: false }) });
    });
    
    await page.route('**/settings/api/providers', async route => {
      return route.fulfill({ status: 200, body: JSON.stringify([{ id: 1, provider_type: 'openai_compatible', enabled: true, display_name: 'Test Provider', base_url: '', model: '' }]) });
    });

    await page.route('**/settings/api/providers/1/test', async route => {
      return route.fulfill({ 
        status: 400, 
        body: JSON.stringify({ message: "API key is not set." }) 
      });
    });

    await page.goto('/settings/advanced');
    
    // Verify Default URL text does not appear
    await expect(page.locator('text=デフォルトのURL')).not.toBeVisible();

    // Test Provider API error handling
    await page.getByTestId('provider-test-button').click();
    await expect(page.getByTestId('settings-message')).toContainText('Test failed: API key is not set.');
  });

  test('should display offline badge', async ({ page }) => {
    await page.route('**/health/pc-api', async route => {
      await route.fulfill({ 
        status: 200, 
        body: JSON.stringify({ ok: false, status: 'offline', message: 'PC conversion server is not reachable' }) 
      });
    });

    await page.goto('/');
    await expect(page.getByText('server: offline')).toBeVisible();
  });
});

test.describe('Mobile Layout', () => {
  test('logged-in mobile header keeps account button at top right', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupAuthenticatedUser(page);
    await setupDefaultApiMocks(page);

    await page.goto('/');

    const brand = page.getByTestId('brand-title');
    const account = page.getByTestId('account-menu-button');

    await expect(brand).toBeVisible();
    await expect(account).toBeVisible();

    const brandBox = await brand.boundingBox();
    const accountBox = await account.boundingBox();
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);

    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1);

    expect(brandBox!.x).toBeLessThan(40);
    expect(accountBox!.x + accountBox!.width).toBeGreaterThan(viewportWidth - 40);
    expect(accountBox!.y).toBeLessThan(brandBox!.y + brandBox!.height + 8);
  });

  test('guest mobile header keeps login button in top row', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupDefaultApiMocks(page);

    await page.goto('/');

    const brand = page.getByTestId('brand-title');
    const guestAuth = page.getByTestId('guest-auth-button');

    await expect(brand).toBeVisible();
    await expect(guestAuth).toBeVisible();
    await expect(guestAuth).toContainText(/ゲスト|ログイン/);

    const brandBox = await brand.boundingBox();
    const loginBox = await guestAuth.boundingBox();
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);

    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
    expect(brandBox!.x).toBeLessThan(40);
    expect(loginBox!.x + loginBox!.width).toBeLessThanOrEqual(viewportWidth + 1);
  });

  test('mobile file select button is prominent above the fold', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupDefaultApiMocks(page);

    await page.goto('/');

    const button = page.getByTestId('file-select-button');
    await expect(button).toBeVisible();

    const box = await button.boundingBox();
    const viewportHeight = await page.evaluate(() => window.innerHeight);

    expect(box!.y).toBeLessThan(viewportHeight * 0.7);
    expect(box!.width).toBeGreaterThan(280);
    expect(box!.height).toBeGreaterThanOrEqual(56);
  });

  test('guest login button can be retried after popup cancellation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupDefaultApiMocks(page);

    await page.goto('/');

    const login = page.getByTestId('guest-auth-button');
    await expect(login).toBeEnabled();

    // Set up mock to throw cancelled error
    await page.evaluate(() => {
      (window as any).__e2e_simulate_login_error = 'auth/popup-closed-by-user';
    });

    await login.click();

    // Should become enabled again
    await expect(login).toBeEnabled({ timeout: 5000 });

    // Set up mock to succeed next time
    await page.evaluate(() => {
      (window as any).__e2e_simulate_login_error = null;
    });

    await login.click();
    // After successful mock login, it might disappear or change state, but we mainly check it could be clicked again
  });
});
