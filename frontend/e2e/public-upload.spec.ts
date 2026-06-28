import { test, expect } from '@playwright/test';
import { setupDefaultApiMocks, setupApiGuard } from './helpers/api';

test.describe('Public Upload UI', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await setupApiGuard(page);
    await setupDefaultApiMocks(page);

    // Clear any token to simulate Guest Mode
    await page.addInitScript(() => {
      window.sessionStorage.removeItem('e2e_token');
      // Mock Turnstile
      window.turnstile = {
        render: (container: string, options: any) => {
          console.log('Turnstile mock rendered');
          setTimeout(() => {
            options.callback('mock-turnstile-token');
          }, 100);
          return 'widget-id';
        },
        reset: () => {},
      };
    });

    // Mock GET /jobs for dashboard (empty by default)
    await page.route('**/jobs', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' }),
        });
      }
      route.fallback();
    });
    
    // Mock GET /public/jobs/job-123
    await page.route('**/public/jobs/job-123?receipt=receipt-abc', async (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'job-123',
          status: 'queued',
          original_filename: 'test.pdf',
          created_at: new Date().toISOString()
        }),
      });
    });

    // Mock /healthz
    await page.route('**/healthz', async (route) => {
      return route.fulfill({ status: 200, body: 'ok' });
    });

    // Mock /limits
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
  });

  test('should show guest mode and handle upload', async ({ page }) => {
    let jobCreated = false;
    
    // Mock POST /jobs for public upload
    await page.route('**/jobs', async (route) => {
      if (route.request().method() === 'POST') {
        jobCreated = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'job-123',
            receipt: 'receipt-abc',
            status: 'queued',
            original_filename: 'test.pdf'
          }),
        });
      }
      route.fallback();
    });

    await page.goto('/');

    // Check Guest mode info box
    await expect(page.locator('summary', { hasText: 'ゲスト利用' })).toBeVisible();

    // Wait for Turnstile token to be ready
    await expect(page.getByTestId('turnstile-ready')).toBeAttached();

    // Trigger upload again
    await page.getByTestId('pdf-file-input').setInputFiles({
      name: 'test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n% dummy pdf\n%%EOF\n')
    });

    // Wait for the job list to reload and fetch the job
    await expect(page.locator('text=test.pdf')).toBeVisible();
    await expect(page.locator('text=待機中')).toBeVisible();
    expect(jobCreated).toBeTruthy();
  });
  
  test('should show guest warning on settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('text=設定はログイン後に利用可能です。')).toBeVisible();
    await expect(page.locator('text=サインインして、翻訳先言語やAPIプロバイダを設定してください。')).toBeVisible();
  });

  test('should show error when api key is required', async ({ page }) => {
    // Mock POST /jobs for public upload to return 400
    await page.route('**/jobs', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'api_key_required'
          }),
        });
      }
      route.fallback();
    });

    await page.goto('/');

    // Wait for Turnstile token to be ready
    await expect(page.getByTestId('turnstile-ready')).toBeAttached();

    // Set file directly to trigger upload
    await page.getByTestId('pdf-file-input').setInputFiles({
      name: 'test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n% dummy pdf\n%%EOF\n')
    });

    // Verify modal message on UI
    await expect(page.locator('text=APIキーが必要です')).toBeVisible();
  });
});
