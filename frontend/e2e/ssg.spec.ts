import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('SSG and SEO requirements', () => {
  test('build output contains SSG files with required content', async () => {
    const aboutHtmlPath = path.resolve('dist-e2e/about.html');
    const licensesHtmlPath = path.resolve('dist-e2e/licenses.html');
    const sitemapPath = path.resolve('dist-e2e/sitemap.xml');
    const robotsPath = path.resolve('dist-e2e/robots.txt');

    // files exist
    expect(fs.existsSync(aboutHtmlPath)).toBe(true);
    expect(fs.existsSync(licensesHtmlPath)).toBe(true);
    expect(fs.existsSync(sitemapPath)).toBe(true);
    expect(fs.existsSync(robotsPath)).toBe(true);

    // Helper to check head metadata
    function getHead(html: string) {
      return html.slice(0, html.indexOf("</head>"));
    }

    function expectHeadMetadata(
      html: string,
      expected: {
        title: string;
        description: string;
        canonical: string;
      }
    ) {
      const head = getHead(html);
      expect(head).toContain(expected.title);
      expect(head).toContain('name="description"');
      expect(head).toContain(expected.description);
      expect(head).toContain('rel="canonical"');
      expect(head).toContain(`href="${expected.canonical}"`);
      expect(head).not.toContain("noindex");
    }

    // index content & SEO
    const indexHtmlPath = path.resolve('dist-e2e/index.html');
    expect(fs.existsSync(indexHtmlPath)).toBe(true);
    const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');
    expectHeadMetadata(indexContent, {
      title: "PDF翻訳 - 翻訳済みPDFと対訳PDFを作成",
      description: "PDFをアップロードして、翻訳済みPDFと対訳PDFを作成できるWebアプリです。",
      canonical: "https://pdftr.pages.dev/",
    });

    // about content & SEO
    const aboutContent = fs.readFileSync(aboutHtmlPath, 'utf8');
    expect(aboutContent).toContain('利用制限と注意事項');
    expectHeadMetadata(aboutContent, {
      title: "利用制限と注意事項 - PDF翻訳",
      description: "PDF翻訳Webアプリの利用制限、保存期間、APIキー、外部サービス利用時の注意事項を説明します。",
      canonical: "https://pdftr.pages.dev/about",
    });

    // licenses content & SEO
    const licensesContent = fs.readFileSync(licensesHtmlPath, 'utf8');
    expect(licensesContent).toContain('AGPL-3.0');
    expect(licensesContent).toContain('pdf2zh-next');
    expect(licensesContent).toContain('github.com/oligamiq/pdf2zh-web-translator');
    expectHeadMetadata(licensesContent, {
      title: "ライセンス - PDF翻訳",
      description: "PDF翻訳Webアプリのライセンス、使用しているOSS、AGPL-3.0コンポーネント、第三者ライセンス情報を掲載しています。",
      canonical: "https://pdftr.pages.dev/licenses",
    });

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

  test('legacy app routes redirect to root routes', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/app/settings');
    await expect(page).toHaveURL(/\/settings/);

    await page.goto('/app/jobs/test-job-id?receipt=abc');
    await expect(page).toHaveURL(/\/jobs\/test-job-id\?receipt=abc/);
  });
});
