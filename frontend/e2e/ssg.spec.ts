import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('SSG and SEO requirements', () => {
  test('build output contains SSG files with required content', async () => {
    const aboutPath = path.resolve('dist/about/index.html');
    const licensesPath = path.resolve('dist/licenses/index.html');
    const aboutHtmlPath = path.resolve('dist/about.html');
    const licensesHtmlPath = path.resolve('dist/licenses.html');
    const sitemapPath = path.resolve('dist/sitemap.xml');
    const robotsPath = path.resolve('dist/robots.txt');

    // files exist
    expect(fs.existsSync(aboutPath)).toBe(true);
    expect(fs.existsSync(licensesPath)).toBe(true);
    expect(fs.existsSync(aboutHtmlPath)).toBe(true);
    expect(fs.existsSync(licensesHtmlPath)).toBe(true);
    expect(fs.existsSync(sitemapPath)).toBe(true);
    expect(fs.existsSync(robotsPath)).toBe(true);

    // about content & SEO
    const aboutContent = fs.readFileSync(aboutPath, 'utf8');
    expect(aboutContent).toContain('利用制限と注意事項');
    expect(aboutContent).toContain('<title>利用制限と注意事項 - PDF翻訳</title>');
    expect(aboutContent).toContain('<meta name="description" content="PDF翻訳Webアプリの利用制限、保存期間、APIキー、外部サービス利用時の注意事項を説明します。" />');
    expect(aboutContent).toContain('<link rel="canonical" href="https://pdftr.pages.dev/about" />');

    // licenses content & SEO
    const licensesContent = fs.readFileSync(licensesPath, 'utf8');
    expect(licensesContent).toContain('AGPL-3.0');
    expect(licensesContent).toContain('pdf2zh-next');
    expect(licensesContent).toContain('github.com/oligamiq/pdf2zh-web-translator');
    expect(licensesContent).toContain('<title>ライセンス - PDF翻訳</title>');
    expect(licensesContent).toContain('<meta name="description" content="PDF翻訳Webアプリのライセンス、使用しているOSS、AGPL-3.0コンポーネント、第三者ライセンス情報を掲載しています。" />');
    expect(licensesContent).toContain('<link rel="canonical" href="https://pdftr.pages.dev/licenses" />');

    // sitemap checks
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    expect(sitemapContent).toContain('https://pdftr.pages.dev/</loc>');
    expect(sitemapContent).toContain('https://pdftr.pages.dev/about</loc>');
    expect(sitemapContent).toContain('https://pdftr.pages.dev/licenses</loc>');
    expect(sitemapContent).not.toContain('/settings');
    expect(sitemapContent).not.toContain('/jobs');
  });

  test('SPA routing to /about and /licenses still works', async ({ page }) => {
    await page.goto('/');
    
    // Go to about
    await page.goto('/about');
    await expect(page.locator('h1', { hasText: '利用制限と注意事項' })).toBeVisible();

    // Go to licenses
    await page.goto('/licenses');
    await expect(page.locator('h1', { hasText: 'ライセンス' })).toBeVisible();
  });

  test('SPA fallback works for /settings', async ({ page }) => {
    // Navigate directly to a dynamic route, should use SPA fallback and load the app
    await page.goto('/settings');
    
    // Wait for the settings page to render its main heading
    await expect(page.locator('h1', { hasText: '設定' })).toBeVisible();
  });
});
