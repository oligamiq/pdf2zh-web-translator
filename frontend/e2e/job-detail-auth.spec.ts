import { test, expect } from '@playwright/test';

test.describe('Job Details Auth & Retry', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Mock Turnstile
    await page.addInitScript(() => {
      window.turnstile = {
        render: (container: string, options: any) => {
          setTimeout(() => options.callback('mock-turnstile-token'), 100);
          return 'widget-id';
        },
        reset: () => {},
      };
    });

    // Mock /healthz
    await page.route('**/healthz', async route => {
      await route.fulfill({ status: 200, body: 'ok' });
    });
  });

  test('should keep loading while auth initializes, and retry on 401', async ({ page }) => {
    // 1. E2E login setup but delay auth
    await page.addInitScript(() => {
      window.sessionStorage.setItem('e2e_token', 'mock-valid-token');
      window.sessionStorage.setItem('e2e_delay_auth', '1500'); // 1.5s delay
    });

    let fetchCount = 0;
    
    // Mock /jobs/job-123
    await page.route('**/jobs/job-123', async route => {
      if (route.request().resourceType() === 'document') {
        const res = await page.request.fetch('/');
        const body = await res.body();
        return route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: body,
        });
      }

      fetchCount++;
      
      if (fetchCount === 1) {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' }),
        });
      }
      
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'job-123',
          status: 'completed',
          original_filename: 'retry-test.pdf',
          created_at: new Date().toISOString(),
          log_tail: 'Some logs here'
        }),
      });
    });

    await page.route('**/jobs/job-123/attempts', async route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'attempt-1',
            job_id: 'job-123',
            provider_order: 1,
            display_name: 'Provider 1 (Ollama)',
            model: 'llama3',
            status: 'failed',
            http_status: 401,
            error_message: 'Unauthorized'
          },
          {
            id: 'attempt-2',
            job_id: 'job-123',
            provider_order: 2,
            display_name: 'Provider 2 (OpenAI)',
            model: 'gpt-4o',
            status: 'success'
          }
        ]),
      });
    });

    // 2. Go to job detail directly (simulate reload)
    await page.goto('/jobs/job-123');

    // 3. Immediately it should show Loading job details... or Checking sign-in...
    await expect(page.getByText('Checking sign-in...').or(page.getByText('Loading job details...'))).toBeVisible({ timeout: 10000 });

    // 4. Wait for job details to load successfully (authReady -> fetch -> 401 -> retry -> 200)
    await expect(page.getByText('retry-test.pdf')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=COMPLETED')).toBeVisible();

    // 5. Check if attempts are displayed
    await expect(page.getByText('API Provider Attempts')).toBeVisible();
    await expect(page.getByText('Provider 1 (Ollama)')).toBeVisible();
    await expect(page.getByText('Provider 2 (OpenAI)')).toBeVisible();
    await expect(page.getByText('Error (HTTP 401): Unauthorized')).toBeVisible();

    // The fetch should have happened exactly twice (1 fail + 1 retry)
    expect(fetchCount).toBe(2);
  });

  test('should show Unauthorized if retry also fails', async ({ page }) => {
    await page.addInitScript(() => {
      window.sessionStorage.setItem('e2e_token', 'mock-invalid-token');
    });

    let fetchCount = 0;
    await page.route('**/jobs/job-123', async route => {
      if (route.request().resourceType() === 'document') {
        const res = await page.request.fetch('/');
        const body = await res.body();
        return route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: body,
        });
      }

      fetchCount++;
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    await page.route('**/jobs/job-123/attempts', async route => {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    await page.goto('/jobs/job-123');

    // Should eventually show the Unauthorized error
    try {
      await expect(page.getByText('Unauthorized (Firebase login expired or invalid)')).toBeVisible({ timeout: 5000 });
    } catch (e) {
      console.log('PAGE HTML:', await page.content());
      throw e;
    }

    // Should have fetched exactly twice (1 fail + 1 retry)
    expect(fetchCount).toBe(2);
  });
});
