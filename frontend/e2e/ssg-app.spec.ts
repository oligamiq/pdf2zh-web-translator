import { test, expect } from '@playwright/test';

test.describe('SolidStart app routes from built output', () => {
  test('SolidStart app routes work from built output', async ({ page }) => {
    // Check Root Route (App Dashboard)
    await page.goto('/');
    await expect(page.getByTestId('upload-card')).toBeVisible();

    // Check Settings Route
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: '設定', exact: true })).toBeVisible();
  });

  test('legacy app routes redirect to root routes', async ({ page }) => {
    await page.goto('/app/settings');
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole('heading', { name: '設定', exact: true })).toBeVisible();

    await page.goto('/app/jobs/test-job-id?receipt=abc');
    await expect(page).toHaveURL(/\/jobs\/test-job-id\?receipt=abc/);
  });
});
