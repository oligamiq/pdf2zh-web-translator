import { test, expect } from '@playwright/test';

test.describe('Settings LLM UI', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    // 1. Bypass auth via sessionStorage
    await page.addInitScript(() => {
      window.sessionStorage.setItem('e2e_token', 'mock_token');
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

  test('should load settings, update api key, and clear api key', async ({ page }) => {
    let putPayload: any = null;
    let mockHasApiKey = false;

    // Mock GET and PUT /settings/llm
    await page.route('**/settings/llm', async (route) => {
      const request = route.request();

      if (request.method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            llm_source: 'openaicompatible',
            llm_base_url: 'https://api.example.com/v1',
            llm_model: 'model-a',
            has_api_key: mockHasApiKey,
          }),
        });
      }

      if (request.method() === 'PUT') {
        putPayload = JSON.parse(request.postData() || '{}');
        if (putPayload.api_key) {
          mockHasApiKey = true;
        } else if (putPayload.clear_api_key) {
          mockHasApiKey = false;
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
      
      route.continue();
    });

    // Go to dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/dashboard.png' });
    
    // 2. Dashboard から Settings へ遷移できる
    await page.click('a:has-text("Settings")');
    await expect(page).toHaveURL(/.*\/settings\/llm/);

    // 3. /settings/llm で GET /settings/llm が呼ばれる (Wait for fields to populate)
    await expect(page.locator('input[placeholder="https://api.example.com/v1"]')).toHaveValue('https://api.example.com/v1');
    await expect(page.locator('input[placeholder="gpt-4o"]')).toHaveValue('model-a');
    
    // 4. Base URL / Model / API Key を入力して保存できる
    await page.fill('input[placeholder="https://api.example.com/v1"]', 'https://new-api.example.com/v1');
    await page.fill('input[placeholder="gpt-4o"]', 'model-b');
    await page.fill('input[placeholder="Enter API Key"]', 'my-secret-key');
    
    await page.click('button:has-text("Save Settings")');
    await expect(page.locator('text=Settings saved successfully.')).toBeVisible();

    // 5. 保存時のPUT payloadに api_key が含まれる
    expect(putPayload).toEqual({
      llm_source: 'openaicompatible',
      llm_base_url: 'https://new-api.example.com/v1',
      llm_model: 'model-b',
      api_key: 'my-secret-key'
    });

    // 6. 保存後、API Key入力欄が空になる
    await expect(page.locator('input[type="password"]')).toHaveValue('');

    // 7. has_api_key=true の「保存済み」表示が出る
    await expect(page.locator('text=保存済み')).toBeVisible();

    // 8. API Key空欄のまま保存したとき、PUT payloadに api_key が含まれない
    putPayload = null; // reset
    await page.click('button:has-text("Save Settings")');
    await expect(page.locator('text=Settings saved successfully.')).toBeVisible();
    
    expect(putPayload).toEqual({
      llm_source: 'openaicompatible',
      llm_base_url: 'https://new-api.example.com/v1',
      llm_model: 'model-b'
    });
    expect(putPayload.api_key).toBeUndefined();

    // 9. 削除ボタンで { clear_api_key: true } が送られる
    // Handle dialog
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("削除")');
    
    await expect(page.locator('text=API Key deleted.')).toBeVisible();
    expect(putPayload).toEqual({ clear_api_key: true });

    // 10. 削除後 has_api_key=false 表示になる
    await expect(page.locator('text=保存済み')).not.toBeVisible();

    // 11. Settings から Dashboard に戻れる
    await page.click('text=← Back');
    await expect(page).toHaveURL(/.*\/$/);
  });
});
