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
    await expect(page.getByText('変換サーバー: オンライン')).toBeVisible();

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
    await expect(page.getByText('変換サーバー: オフライン')).toBeVisible();
    await expect(page.getByText('ジョブは登録できますが、サーバー復旧まで変換は開始されません')).toBeVisible();
  });
});
