import { test, expect } from '@playwright/test';

test.describe('SolidStart app routes from built output', () => {
  test('SolidStart app routes work from built output', async ({ page }) => {
    // Check Landing Page
    await page.goto('/');
    await expect(page.getByRole('link', { name: /PDFを翻訳する/ })).toHaveAttribute('href', '/app');
    await expect(page.getByText('PDFファイルを選択')).toHaveCount(0);

    // Check App Route
    await page.goto('/app');
    await expect(page.getByTestId('upload-card')).toBeVisible();

    // Check App Settings Route
    await page.goto('/app/settings');
    await expect(page.getByRole('heading', { name: '設定', exact: true })).toBeVisible();
  });

  test('legacy routes redirect to app routes', async ({ page }) => {
    // Cloudflare _redirects or _worker.js routing should redirect this
    // It's possible the URL changes, or it acts as a rewrite/alias. We just check if it works and shows settings.
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/app\/settings/);
    await expect(page.getByRole('heading', { name: '設定', exact: true })).toBeVisible();
  });
});
