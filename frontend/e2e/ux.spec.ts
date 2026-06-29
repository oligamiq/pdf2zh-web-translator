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

  test('mobile file select button stays inside upload card', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupDefaultApiMocks(page);

    await page.goto('/');

    const card = page.getByTestId('upload-card');
    const button = page.getByTestId('file-select-button');

    await expect(card).toBeVisible();
    await expect(button).toBeVisible();

    const cardBox = await card.boundingBox();
    const buttonBox = await button.boundingBox();
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);

    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1);

    expect(buttonBox!.x).toBeGreaterThanOrEqual(cardBox!.x);
    expect(buttonBox!.x + buttonBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width);
    expect(buttonBox!.width).toBeGreaterThan(cardBox!.width * 0.75);
    expect(buttonBox!.height).toBeGreaterThanOrEqual(56);
  });

  for (const width of [360, 390, 430]) {
    test(`mobile upload CTA stays inside card at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await setupDefaultApiMocks(page);
      await page.goto('/');

      const cardBox = await page.getByTestId('upload-card').boundingBox();
      const buttonBox = await page.getByTestId('file-select-button').boundingBox();
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);

      expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 1);
      expect(buttonBox!.x).toBeGreaterThanOrEqual(cardBox!.x);
      expect(buttonBox!.x + buttonBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width);
    });
  }

  test('guest login button recovers after popup cancellation (async reject)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupDefaultApiMocks(page);

    await page.addInitScript(() => {
      (window as any).__e2e_simulate_login_error = {
        code: 'auth/popup-closed-by-user',
        delayMs: 500,
      };
    });

    await page.goto('/');

    const login = page.getByTestId('guest-auth-button');
    await expect(login).toBeEnabled();

    await login.click();
    await expect(login).toBeDisabled();

    // Should become enabled again after delay
    await expect(login).toBeEnabled({ timeout: 5000 });

    // Should be clickable again
    await login.click();
    await expect(login).toBeDisabled();
  });

  test('guest login button recovers after popup cancellation on focus return', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupDefaultApiMocks(page);

    await page.addInitScript(() => {
      (window as any).__e2e_simulate_login_hang = true;
    });

    await page.goto('/');

    const login = page.getByTestId('guest-auth-button');
    await expect(login).toBeEnabled();

    await login.click();
    await expect(login).toBeDisabled();

    // Simulate focus return after user closes the popup externally
    await page.evaluate(() => {
      window.dispatchEvent(new Event('focus'));
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Should become enabled again
    await expect(login).toBeEnabled({ timeout: 5000 });

    // Should be clickable again
    await login.click();
    await expect(login).toBeDisabled();
  });

  test("live log tail body keeps minimum readable height in short viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 260 });
    await page.route('**/jobs/test-job-id', async route => {
      if (route.request().resourceType() === 'document') {
        return route.fallback();
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-job-id',
          status: 'running',
          original_filename: 'test.pdf',
          created_at: new Date().toISOString(),
          log_tail: 'short log snippet'
        })
      });
    });

    await page.route('**/jobs/test-job-id/attempts', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/jobs/test-job-id/log?offset=0*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: "Translation log type error progress in short viewport\nLine 2\nLine 3\nLine 4\nLine 5",
          next_offset: 100
        })
      });
    });

    await page.goto("/jobs/test-job-id");

    const headings = page.getByRole("heading", { name: "Live Log Tail" });
    await expect(headings).toHaveCount(1);

    const body = page.getByTestId("live-log-tail-body");
    await expect(body).toBeVisible();

    const box = await body.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(96);

    const overflowY = await body.evaluate((el) => window.getComputedStyle(el).overflowY);
    expect(["auto", "scroll"]).toContain(overflowY);

    await expect(body).toContainText(/type|error|progress|Translation|log/i);
  });
});
