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
        const postData = route.request().postData();
        // Since it's FormData, it's not a simple string, but we can just check if we got here
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

    // Handle dialog for empty API key
    let dialogHandled = false;
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Ollama APIキーなしで続行しますか？');
      dialogHandled = true;
      await dialog.dismiss(); // dismiss to test entering key later
    });

    // Wait a bit for Turnstile and logic
    await page.waitForTimeout(500);

    // Set file directly
    await page.getByTestId('pdf-file-input').setInputFiles({
      name: 'test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n% dummy pdf\n%%EOF\n')
    });

    // Dialog should have been handled
    expect(dialogHandled).toBeTruthy();
    expect(jobCreated).toBeFalsy(); // Because we dismissed

    // Now enter an API key
    await page.fill('input[placeholder="sk-..."]', 'my-secret-key');

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
    await page.goto('/settings/llm');
    await expect(page.locator('text=Settings are available after signing in.')).toBeVisible();
    await expect(page.locator('text=For guest mode, enter an API key on the upload form for one-time use.')).toBeVisible();
  });
});
