import { test, expect } from '@playwright/test';

test.describe('Public Upload UI', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

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

    // Check Guest mode header
    await expect(page.locator('span', { hasText: 'Guest mode' })).toBeVisible();

    // Check Guest mode info box
    await expect(page.locator('text=Max file size: 5 MiB')).toBeVisible();

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
    await expect(page.locator('text=QUEUED')).toBeVisible();
    expect(jobCreated).toBeTruthy();
  });
  
  test('should show guest warning on settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('text=Settings are available after signing in.')).toBeVisible();
    await expect(page.locator('text=Please sign in to configure default target language and API providers.')).toBeVisible();
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
    await expect(page.locator('text=API Key Required')).toBeVisible();
  });
});
