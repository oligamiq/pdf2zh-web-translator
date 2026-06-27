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

    // Check Sign in with Google button is present
    const signInBtn = page.locator('button', { hasText: 'Sign in with Google' });
    await expect(signInBtn).toBeVisible();

    // We no longer click the sign-in button here to avoid navigating away from Guest Mode
    // or triggering real popups. The presence of the button is sufficient for this test.

    // Check Guest mode info box
    await expect(page.locator('text=Max file size: 5 MiB')).toBeVisible();

    // Handle dialog for empty API key
    let dialogHandled = false;
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Ollama APIキーなしで続行しますか？');
      dialogHandled = true;
      await dialog.dismiss(); // dismiss to test entering key later
    });

    // Wait for Turnstile token to be ready
    await expect(page.getByTestId('turnstile-ready')).toBeAttached();

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

  test('should handle full page drag and drop upload', async ({ page }) => {
    let jobCreated = false;
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
            original_filename: 'dragged.pdf'
          }),
        });
      }
      route.fallback();
    });

    await page.goto('/');
    await page.fill('input[placeholder="sk-..."]', 'my-secret-key');

    // Wait for Turnstile token to be ready
    await expect(page.getByTestId('turnstile-ready')).toBeAttached();

    // Simulate dragenter and drop entirely within evaluate to avoid DataTransfer serialization issues
    await page.evaluate(() => {
      const dt = new DataTransfer();
      const file = new File(['%PDF-1.4\\n% dummy pdf\\n%%EOF\\n'], 'dragged.pdf', { type: 'application/pdf' });
      dt.items.add(file);

      const dragEnterEvent = new DragEvent('dragenter', { bubbles: true, cancelable: true });
      Object.defineProperty(dragEnterEvent, 'dataTransfer', { value: dt });
      document.dispatchEvent(dragEnterEvent);

      const dropEvent = new DragEvent('drop', { bubbles: true, cancelable: true });
      Object.defineProperty(dropEvent, 'dataTransfer', { value: dt });
      document.dispatchEvent(dropEvent);
    });

    // Job should be created. Note: The global mock for GET /public/jobs/job-123 returns 'test.pdf', not 'dragged.pdf'
    await expect(page.locator('text=test.pdf')).toBeVisible();
    expect(jobCreated).toBeTruthy();
  });
  
  test('should show guest warning on settings page', async ({ page }) => {
    await page.goto('/settings/llm');
    await expect(page.locator('text=Settings are available after signing in.')).toBeVisible();
    await expect(page.locator('text=For guest mode, enter an API key on the upload form for one-time use.')).toBeVisible();
  });

  test('should show error when public fallback is disabled and no API key is provided', async ({ page }) => {
    // Mock POST /jobs for public upload to return 503
    await page.route('**/jobs', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Public fallback LLM is not configured. Please enter your own Ollama API key or sign in and configure Settings.'
          }),
        });
      }
      route.fallback();
    });

    await page.goto('/');

    // Handle dialog for empty API key - accept it to proceed to upload
    page.on('dialog', async dialog => {
      await dialog.accept(); 
    });

    // Wait for Turnstile token to be ready
    await expect(page.getByTestId('turnstile-ready')).toBeAttached();

    // Set file directly to trigger upload
    await page.getByTestId('pdf-file-input').setInputFiles({
      name: 'test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n% dummy pdf\n%%EOF\n')
    });

    // Verify error message on UI
    await expect(page.locator('text=APIキーなしのお試し変換は現在利用できません。')).toBeVisible();
  });

  test('should redirect /login to /', async ({ page }) => {
    await page.goto('/login');
    // It should immediately redirect to /
    await expect(page).toHaveURL(/.*\/$/);
    await expect(page.locator('span', { hasText: 'Guest mode' })).toBeVisible();
  });

  test('should reactively update UI on login and logout without reload', async ({ page }) => {
    // 1. Guest状態でDashboardを開く
    await page.goto('/');

    // 2. Guest mode と Sign in with Google が表示される
    await expect(page.locator('span', { hasText: 'Guest mode' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Sign in with Google' })).toBeVisible();

    // 3. E2E mock loginを実行
    await page.locator('button', { hasText: 'Sign in with Google' }).click();

    // 4. 同じページで e2e-user@example.com と Settings が表示される
    await expect(page.locator('span', { hasText: 'e2e-user@example.com' })).toBeVisible();
    await expect(page.locator('a', { hasText: 'Settings' })).toBeVisible();

    // 5. Sign out をクリック
    await page.locator('button', { hasText: 'Sign out' }).click();

    // 6. 同じページで Guest mode と Sign in with Google に戻る
    await expect(page.locator('span', { hasText: 'Guest mode' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Sign in with Google' })).toBeVisible();

    // 7. /login へ遷移していないことを確認
    expect(page.url().endsWith('/')).toBeTruthy();
  });

  test('should display API key input even when logged in', async ({ page }) => {
    // 1. E2E logged-in状態でDashboard表示
    await page.goto('/');
    await page.locator('button', { hasText: 'Sign in with Google' }).click();

    // 2. UploadFormにOllama API Key入力欄が表示される
    await expect(page.locator('input[placeholder="sk-..."]')).toBeVisible();

    // 3. Settingsリンクも表示される
    await expect(page.locator('a', { hasText: 'Settings' })).toBeVisible();

    // Save checkbox should be visible for logged in user
    await expect(page.locator('text=Save this API key to my account settings')).toBeVisible();
  });

  test('should render dashboard while auth initializes', async ({ page }) => {
    // Set e2e_delay_auth to delay authReady by 2 seconds
    await page.addInitScript(() => {
      window.sessionStorage.setItem('e2e_delay_auth', '2000');
    });

    await page.goto('/');

    // Dashboard UI is visible immediately
    await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();

    // The header shows 'Checking sign-in...'
    await expect(page.locator('.header').getByText('Checking sign-in...')).toBeVisible();
    
    // The JobQueue shows 'Loading jobs...'
    await expect(page.getByTestId('job-queue').getByText('Loading jobs...')).toBeVisible();
    
    // The Upload PDF form should be visible
    await expect(page.locator('text=Drag and drop or click to select PDF file')).toBeVisible();

    // During this time, the upload dropzone shows Initializing sign-in state...
    await expect(page.locator('text=Initializing sign-in state...')).toBeVisible();

    // We wait for auth to finish (delay is 2s, should finish shortly)
    await expect(page.locator('span', { hasText: 'Guest mode' })).toBeVisible({ timeout: 5000 });
    
    // Now the messages should be gone
    await expect(page.locator('.header').getByText('Checking sign-in...')).toBeHidden();
    await expect(page.getByTestId('job-queue').getByText('Loading jobs...')).toBeHidden();
    await expect(page.locator('text=Initializing sign-in state...')).toBeHidden();
  });

  test('should prompt to save API key if entered in guest mode before login and no existing key', async ({ page }) => {
    // Mock /settings/llm to return has_api_key = false initially, then success on PUT
    await page.route('**/settings/llm', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ llm_source: 'openaicompatible', llm_base_url: '', llm_model: '', has_api_key: false })
        });
      } else if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');

    // 1. Guest modeでAPI key欄に dummy key を入力
    await page.locator('input[placeholder="sk-..."]').fill('dummy-api-key');

    // 2. E2E mock login
    await page.locator('button', { hasText: 'Sign in with Google' }).click();

    // 3. API key入力値が消えない
    await expect(page.locator('input[placeholder="sk-..."]')).toHaveValue('dummy-api-key');

    // 5. 「保存しますか？」promptが表示される
    await expect(page.locator('text=入力済みのOllama APIキーをアカウント設定に保存しますか？')).toBeVisible();

    // 6. Save to Settingsを押す (保存する)
    await page.locator('button', { hasText: '保存する' }).click();

    // 8. prompt is gone and API key本体はUIに再表示/ログ出力されない
    await expect(page.locator('text=入力済みのOllama APIキーをアカウント設定に保存しますか？')).toBeHidden();
  });

  test('should not prompt to save API key if user already has an existing key', async ({ page }) => {
    // Mock /settings/llm to return has_api_key = true
    await page.route('**/settings/llm', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ llm_source: 'openaicompatible', llm_base_url: '', llm_model: '', has_api_key: true })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');

    // 1. Guest modeでAPI keyを入力
    await page.locator('input[placeholder="sk-..."]').fill('dummy-api-key');

    // 2. login
    await page.locator('button', { hasText: 'Sign in with Google' }).click();

    // 4. 保存提案は出ない
    await expect(page.locator('text=入力済みのOllama APIキーをアカウント設定に保存しますか？')).toBeHidden();
  });
});
