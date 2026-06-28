import { test, expect } from '@playwright/test';

test.describe('Layout & Long Text Resistance', () => {
  const longFilename = 'A'.repeat(120) + '_super_long_filename_that_tests_layout_overflow_and_ellipsis_behavior.pdf';
  const longLogLine = 'B'.repeat(1000);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.sessionStorage.setItem('e2e_token', 'mock-valid-token');
      window.turnstile = {
        render: (container: string, options: any) => {
          setTimeout(() => options.callback('mock-turnstile-token'), 100);
          return 'widget-id';
        },
        reset: () => {},
      };
    });

    await page.route('**/health/pc-api', async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true, status: 'online' }) });
    });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  });

  const checkOverlap = async (locator1: any, locator2: any) => {
    const box1 = await locator1.boundingBox();
    const box2 = await locator2.boundingBox();
    if (!box1 || !box2) return false;
    return !(
      box1.x + box1.width <= box2.x ||
      box2.x + box2.width <= box1.x ||
      box1.y + box1.height <= box2.y ||
      box2.y + box2.height <= box1.y
    );
  };

  test('Job list should not overlap filename and status on various viewports', async ({ page }) => {
    await page.route('**/jobs', async route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'job-1',
            status: 'completed',
            original_filename: longFilename,
            created_at: new Date().toISOString(),
          }
        ]),
      });
    });

    const viewports = [
      { width: 1280, height: 800 },
      { width: 768, height: 800 },
      { width: 390, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/');

      const row = page.getByTestId('job-row').first();
      const filenameLocator = row.getByTestId('job-filename');
      const statusLocator = row.getByTestId('job-status');
      const actionsLocator = row.getByTestId('job-actions');

      await expect(filenameLocator).toBeVisible();
      await expect(statusLocator).toBeVisible();

      // Sanity checks done via bounding box analysis below

      const rowBox = await row.boundingBox();
      const fnBox = await filenameLocator.boundingBox();
      const actionsBox = await actionsLocator.boundingBox();
      
      expect(rowBox).not.toBeNull();
      expect(fnBox).not.toBeNull();
      expect(actionsBox).not.toBeNull();

      if (rowBox && fnBox && actionsBox) {
        // filename should be contained within the card
        expect(fnBox.x).toBeGreaterThanOrEqual(rowBox.x);
        // actions should be contained within the card
        expect(actionsBox.x + actionsBox.width).toBeLessThanOrEqual(rowBox.x + rowBox.width + 1); // +1 for rounding differences
        
        const isStacked = Math.round(fnBox.y + fnBox.height) <= Math.round(actionsBox.y);
        if (!isStacked) {
          // If they are on the same horizontal band, they must be side-by-side without overlap
          expect(fnBox.x + fnBox.width).toBeLessThanOrEqual(actionsBox.x);
        } else {
          // If they are stacked vertically, the check is already true by definition of isStacked
          expect(isStacked).toBe(true);
        }
      }
    }
  });

  test('Job detail should not overlap filename and status, and log tail should stay within container', async ({ page }) => {
    await page.route(/\/jobs\/job-1/, async route => {
      if (route.request().resourceType() === 'document') {
        return route.continue();
      }
      const url = route.request().url();
      if (url.includes('/attempts')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
      if (url.includes('/log')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: 'A'.repeat(1000),
            next_offset: 1000,
          }),
        });
      }
      // Default to returning the job
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'job-1',
          status: 'failed',
          original_filename: longFilename,
          created_at: new Date().toISOString(),
          error_message: 'Test Error',
          log_tail: `Line 1\n${longLogLine}\nLine 3`
        }),
      });
    });

    const viewports = [
      { width: 1280, height: 800 },
      { width: 390, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/jobs/job-1');

      const summary = page.getByTestId('job-summary');
      const filenameLocator = summary.getByTestId('job-summary-filename');
      const statusLocator = summary.getByTestId('job-summary-status');

      await expect(filenameLocator).toBeVisible();
      
      // Ensure no overlap between filename and status element
      expect(await checkOverlap(filenameLocator, statusLocator)).toBe(false);

      // Check log tail
      const logDetails = page.locator('details');
      await logDetails.click(); // Open details
      
      const preLocator = page.getByTestId('live-log-pre');
      await expect(preLocator).toBeVisible();

      const preBox = await preLocator.boundingBox();
      const parentBox = await page.getByTestId('live-log').boundingBox();
      
      // Ensure pre width does not exceed parent width
      expect(preBox!.width).toBeLessThanOrEqual(parentBox!.width + 1); // +1 for rounding safe
    }
  });
  test('Header layout should use compact Account icon button on all viewports', async ({ page }) => {
    // Mock logged in user with a long email to test overflow
    const longEmail = 'very_long_user_email_address_that_could_break_layout@example.com';
    await page.addInitScript((email) => {
      window.sessionStorage.setItem('e2e_token', 'mock-valid-token');
      window.sessionStorage.setItem('e2e_user_email', email);
    }, longEmail);

    await page.route('**/jobs', async route => {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    
    // We should also mock /limits so the page loads cleanly
    await page.route('**/limits', async route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          scope: 'authenticated',
          pdf_max_bytes: 20971520,
          jobs_per_day: 10,
          jobs_used_today: 0,
          jobs_remaining_today: 10,
          retention_days: 7,
          public_job_expiry_hours: 24
        }),
      });
    });

    const viewports = [
      { width: 1280, height: 800 },
      { width: 768, height: 800 },
      { width: 390, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/');

      const brand = page.locator('.brand');
      // aria-label="アカウントメニュー" でボタンを取得できる
      const accountMenuBtn = page.getByRole('button', { name: 'アカウントメニュー' });
      const accountAvatar = accountMenuBtn.locator('.account-avatar');
      const emailSpan = page.locator('.account-menu-email');
      const settingsBtn = page.getByRole('menuitem', { name: '設定' });
      const aboutBtn = page.getByRole('menuitem', { name: '利用制限と注意事項' });
      const signoutBtn = page.getByRole('menuitem', { name: 'ログアウト' });
      const popover = page.locator('.account-menu-popover');

      await expect(brand).toBeVisible();
      await expect(accountMenuBtn).toBeVisible();
      
      // desktop幅でもmobile幅でも account button は48px以下の丸アイコン
      const box = await accountMenuBtn.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeLessThanOrEqual(48);
        expect(box.height).toBeLessThanOrEqual(48);
      }

      // desktop幅でも Account 文字列がヘッダー上に表示されない (ラベル自体が存在しない)
      await expect(page.locator('.account-menu-label')).not.toBeAttached();
      
      // アバターは常に表示
      await expect(accountAvatar).toBeVisible();
      
      // メールアドレス / Settings / Sign out が常時表示されない
      await expect(popover).not.toBeVisible();
      await expect(emailSpan).not.toBeVisible();
      await expect(settingsBtn).not.toBeVisible();
      await expect(aboutBtn).not.toBeVisible();
      await expect(signoutBtn).not.toBeVisible();

      // アイコンを押すとメールアドレス / Settings / Sign out が表示される
      await accountMenuBtn.click();
      await expect(popover).toBeVisible();
      await expect(emailSpan).toBeVisible();
      await expect(emailSpan).toHaveText(longEmail);
      await expect(settingsBtn).toBeVisible();
      await expect(aboutBtn).toBeVisible();
      await expect(signoutBtn).toBeVisible();

      // 長いメールアドレスでもメニューが崩れない (popover is contained in viewport)
      const popoverBox = await popover.boundingBox();
      expect(popoverBox).not.toBeNull();
      if (popoverBox) {
        expect(popoverBox.x + popoverBox.width).toBeLessThanOrEqual(vp.width);
      }

      // Escape で閉じる
      await page.keyboard.press('Escape');
      await expect(popover).not.toBeVisible();

      // 外側クリックで閉じる
      await accountMenuBtn.click();
      await expect(popover).toBeVisible();
      await page.mouse.click(10, 10); // click top-left outside the menu
      await expect(popover).not.toBeVisible();
    }
  });

  test('Account menu actions (Settings, About, Sign out)', async ({ page }) => {
    await page.addInitScript(() => {
      window.sessionStorage.setItem('e2e_token', 'mock-valid-token');
      window.sessionStorage.setItem('e2e_user_email', 'user@example.com');
    });

    await page.route('**/jobs', async route => {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    
    await page.route('**/limits', async route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          scope: 'authenticated',
          pdf_max_bytes: 20971520,
          jobs_per_day: 10,
          jobs_used_today: 0,
          jobs_remaining_today: 10,
          retention_days: 7,
          public_job_expiry_hours: 24
        }),
      });
    });

    await page.goto('/');

    const accountMenuBtn = page.getByRole('button', { name: 'アカウントメニュー' });
    const settingsBtn = page.getByRole('menuitem', { name: '設定' });
    const aboutBtn = page.getByRole('menuitem', { name: '利用制限と注意事項' });
    const signoutBtn = page.getByRole('menuitem', { name: 'ログアウト' });

    // Settings を押すと設定画面へ移動する
    await accountMenuBtn.click();
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();
    
    // We should be on /settings
    await expect(page).toHaveURL(/.*\/settings/);
    
    // Go back to check about
    await page.goto('/');
    await accountMenuBtn.click();
    await expect(aboutBtn).toBeVisible();
    await aboutBtn.click();
    
    // We should be on /about
    await expect(page).toHaveURL(/.*\/about/);

    // Go back to check sign out
    await page.goto('/');
    await accountMenuBtn.click();
    await expect(signoutBtn).toBeVisible();

    // Mock API for signout / checking if logout is called
    let logoutCalled = false;
    await page.route('**/auth/logout', async route => {
      logoutCalled = true;
      return route.fulfill({ status: 200, body: '{}' });
    });

    // Sign out を押すとサインアウト処理が呼ばれる
    await signoutBtn.click();
    await expect(page.locator('.account-menu-popover')).not.toBeVisible();
    
    // In our app, handleLogout clears token and updates state.
    // Ensure logout API was actually hit, or the UI returned to guest mode.
    // The Guest mode will just show the login button again if currentUser is updated,
    // but the API call is a good enough check for now.
    // We can also check if the button changed to "Sign in with Google".
    await expect(page.getByRole('button', { name: 'Googleでログイン' })).toBeVisible();
  });
});
