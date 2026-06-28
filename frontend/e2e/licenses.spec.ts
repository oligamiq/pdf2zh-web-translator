import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Licenses page', () => {

  test('Licenses page is accessible and displays content', async ({ page }) => {
    // Navigate directly to licenses
    await page.goto('/licenses');
    
    // Check headings
    await expect(page.locator('h1', { hasText: 'ライセンス' })).toBeVisible();
    await expect(page.locator('h2', { hasText: '重要なライセンス上の注意' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'このアプリのライセンス' })).toBeVisible();
    await expect(page.locator('h2', { hasText: '翻訳対象PDFの権利についての注意' })).toBeVisible();
    await expect(page.locator('h2', { hasText: '主要な依存ライブラリ' })).toBeVisible();
    
    // Check specific text
    await expect(page.locator('text=このアプリのソースコードは MIT License のもとで提供されます。')).toBeVisible();
    await expect(page.locator('text=アップロードするPDFの著作権・利用権は利用者自身が確認してください。')).toBeVisible();
    await expect(page.locator('text=pdf2zh-next は AGPL-3.0 ライセンス')).toBeVisible();
    await expect(page.locator('text=ソースコードURLは公開準備中です。').or(page.locator('text=ソースコードを見る'))).toBeVisible();
    
    // Check that some dependency is loaded (e.g. solid-js)
    // The fetch might take a moment, so wait for it
    await expect(page.locator('text=solid-js')).toBeVisible();
    await expect(page.locator('text=MIT').first()).toBeVisible();
    
    // Check that AGPL and pdf2zh-next are in the list
    await expect(page.locator('text=pdf2zh-next').first()).toBeVisible();
    await expect(page.locator('text=AGPL-3.0').first()).toBeVisible();
  });

  test('THIRD_PARTY_NOTICES.md has copyleft section', async () => {
    const noticesPath = path.resolve('../THIRD_PARTY_NOTICES.md');
    const noticesContent = fs.readFileSync(noticesPath, 'utf8');
    expect(noticesContent).toContain('Important copyleft dependencies');
    expect(noticesContent).toContain('pdf2zh-next');
    expect(noticesContent).toContain('AGPL-3.0');
  });

  test('Can navigate to licenses from about page', async ({ page }) => {
    await page.goto('/about');
    await page.click('a:has-text("ライセンスを見る")');
    await expect(page).toHaveURL(/.*\/licenses/);
  });

  test('Can navigate to licenses from guest account menu', async ({ page }) => {
    await page.goto('/');
    await page.click('a:has-text("ライセンス")');
    await expect(page).toHaveURL(/.*\/licenses/);
  });

  test('Can navigate to licenses from logged-in account menu', async ({ page }) => {
    // Mock user login
    await page.addInitScript(() => {
      window.sessionStorage.setItem('e2e_token', 'mock-token');
      window.sessionStorage.setItem('e2e_user_email', 'test@example.com');
    });
    
    await page.goto('/');
    
    // Open menu
    await page.getByRole('button', { name: 'アカウントメニュー' }).click();
    await page.click('a:has-text("ライセンス")');
    await expect(page).toHaveURL(/.*\/licenses/);
  });

});
