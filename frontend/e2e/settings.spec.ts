import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser } from './helpers/auth';
import { setupDefaultApiMocks, setupApiGuard } from './helpers/api';

test.describe('Settings UI', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await setupApiGuard(page);
    await setupDefaultApiMocks(page);
    await setupAuthenticatedUser(page);

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
    await page.getByTestId('account-menu-button').click();
    await page.click('a:has-text("設定")');
    await expect(page).toHaveURL(/.*\/settings/);

    await expect(page.locator('h2', { hasText: '基本API設定' })).toBeVisible();

    // Go to Advanced
    await page.click('text=高度な設定を開く');
    await expect(page).toHaveURL(/.*\/settings\/advanced/);
    await expect(page.locator('h1', { hasText: '高度なAPIルーティング' })).toBeVisible();
    await expect(page.locator('text=設定されたProviderはありません。')).toBeVisible();
  });

  test('should allow adding SiliconFlow Free provider without API key and confirm privacy', async ({ page }) => {
    // Mock GET /settings/api/basic
    await page.route('**/settings/api/basic', async (route) => {
      return route.fulfill({ status: 200, body: JSON.stringify({ target_language: 'ja', has_api_key: false }) });
    });
    
    // Mock GET /settings/api/providers
    let getCallCount = 0;
    await page.route('**/settings/api/providers', async (route) => {
      if (route.request().method() === 'GET') {
        getCallCount++;
        if (getCallCount === 1) {
          return route.fulfill({ status: 200, body: JSON.stringify([]) });
        } else {
          return route.fulfill({ status: 200, body: JSON.stringify([{ id: 1, provider_type: 'siliconflow_free', enabled: true, display_name: 'SiliconFlow Free' }]) });
        }
      }
      route.fallback();
    });

    // Mock POST /settings/api/providers
    let postBody: any = null;
    await page.route('**/settings/api/providers', async (route) => {
      if (route.request().method() === 'POST') {
        postBody = JSON.parse(route.request().postData() || '{}');
        return route.fulfill({ status: 200, body: JSON.stringify({ id: 1 }) });
      }
      route.fallback();
    });

    // Handle dialog
    let dialogShown = false;
    page.on('dialog', async (dialog) => {
      dialogShown = true;
      expect(dialog.message()).toContain("SiliconFlow Freeは、PDFデータを");
      await dialog.accept();
    });

    await page.goto('/settings/advanced');
    
    await page.getByTestId('add-provider-button').click();
    await expect(page.locator('text=Providerを追加').first()).toBeVisible();

    await page.selectOption('select', 'siliconflow_free');
    
    await expect(page.locator('text=この無料サービスではAPIキー、Base URL、Modelの入力は不要です。')).toBeVisible();

    await page.click('button[form="provider-form"]');
    
    await expect(page.locator('text=Provider added.')).toBeVisible();
    
    expect(dialogShown).toBe(true);
    expect(postBody).toBeTruthy();
    expect(postBody.provider_type).toBe('siliconflow_free');
    expect(postBody.base_url).toBe('');
    expect(postBody.model).toBe('');
    
    await expect(page.locator('text=APIキー不要')).toBeVisible();
    await expect(page.locator('text=無料サービス')).toBeVisible();
  });
});
