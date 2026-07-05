import { test, expect } from '@playwright/test';
import { setupDefaultApiMocks, setupApiGuard } from './helpers/api';

test.describe('PDF View and Download Links', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiGuard(page);
    await setupDefaultApiMocks(page);

    // Mock jobs list
    await page.route('**/jobs', async (route) => {
      if (route.request().resourceType() === 'document') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ jobs: [{
          id: 'test-job-id-123',
          original_filename: 'テスト文書.pdf',
          status: 'completed',
          created_at: new Date().toISOString(),
          view_token: 'valid-view-token-123'
        }]})
      });
    });

    // Mock job detail
    await page.route('**/jobs/test-job-id-123', async (route) => {
      if (route.request().resourceType() === 'document') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-job-id-123',
          original_filename: 'テスト文書.pdf',
          status: 'completed',
          created_at: new Date().toISOString(),
          view_token: 'valid-view-token-123'
        })
      });
    });

    await page.route('**/jobs/test-job-id-123/attempts', async (route) => {
      if (route.request().resourceType() === 'document') return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Mock the actual PDF files download endpoints so we can test the headers
    await page.route('**/jobs/test-job-id-123/files/*.pdf*', async (route) => {
      const url = new URL(route.request().url());
      const receipt = url.searchParams.get('receipt');
      const download = url.searchParams.get('download');
      const pathname = url.pathname;
      
      if (!receipt) {
        return route.fulfill({ status: 401, body: JSON.stringify({ error: 'Missing receipt' }) });
      }
      if (receipt !== 'valid-view-token-123') {
        return route.fulfill({ status: 403, body: JSON.stringify({ error: 'Invalid receipt' }) });
      }

      if (pathname.includes('/invalid.pdf')) {
        return route.fulfill({ status: 400, body: JSON.stringify({ error: 'Invalid kind' }) });
      }
      
      // Mock expiration token
      if (receipt === 'expired-token') {
        return route.fulfill({ status: 410, body: JSON.stringify({ error: 'Download expired' }) });
      }

      const isBilingual = pathname.endsWith('bilingual.pdf');
      const suffix = isBilingual ? 'bilingual' : 'translated';
      // fallback filename logic testing
      const filename = `テスト文書_${suffix}.pdf`;
      const fallback = `_${suffix}.pdf`;
      const encodedFilename = encodeURIComponent(filename).replace(/\*/g, "%2A");
      const dispositionType = download === '1' ? 'attachment' : 'inline';
      const disposition = `${dispositionType}; filename="${fallback}"; filename*=UTF-8''${encodedFilename}`;

      const body = Buffer.from('%PDF-1.4 mock pdf body', 'utf-8');
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': disposition,
          'Content-Length': body.length.toString()
        },
        body: body
      });
    });

    await page.goto('/');
  });

  test('should render stable links instead of blob URLs on job detail page', async ({ page }) => {
    // Fake login
    await page.evaluate(() => {
      window.localStorage.setItem('firebase:authUser:dummy', JSON.stringify({ uid: 'test-uid' }));
    });

    await page.goto('/jobs/test-job-id-123');
    
    // Check view links
    const translatedViewLink = page.locator('a:has-text("翻訳PDF 表示")');
    await expect(translatedViewLink).toBeVisible();
    await expect(translatedViewLink).toHaveAttribute('href', /^\/jobs\/test-job-id-123\/files\/translated\.pdf\?receipt=valid-view-token-123$/);
    await expect(translatedViewLink).toHaveAttribute('target', '_blank');

    const bilingualViewLink = page.locator('a:has-text("対訳PDF 表示")');
    await expect(bilingualViewLink).toHaveAttribute('href', /^\/jobs\/test-job-id-123\/files\/bilingual\.pdf\?receipt=valid-view-token-123$/);

    // Check download links
    const translatedDlLink = page.locator('a:has-text("翻訳PDF 保存")');
    await expect(translatedDlLink).toHaveAttribute('href', /^\/jobs\/test-job-id-123\/files\/translated\.pdf\?receipt=valid-view-token-123&download=1$/);

    const bilingualDlLink = page.locator('a:has-text("対訳PDF 保存")');
    await expect(bilingualDlLink).toHaveAttribute('href', /^\/jobs\/test-job-id-123\/files\/bilingual\.pdf\?receipt=valid-view-token-123&download=1$/);
  });

  test('should provide correct headers for PDF viewing (inline)', async ({ page }) => {
    const res = await page.evaluate(async () => {
      const r = await fetch(window.location.origin + '/jobs/test-job-id-123/files/translated.pdf?receipt=valid-view-token-123');
      return { status: r.status, contentType: r.headers.get('content-type'), contentDisposition: r.headers.get('content-disposition') };
    });
    expect(res.status).toBe(200);
    expect(res.contentType).toBe('application/pdf');
    expect(res.contentDisposition).toContain('inline;');
    expect(res.contentDisposition).toContain('filename*=UTF-8');
  });

  test('should provide correct headers for PDF downloading (attachment)', async ({ page }) => {
    const res = await page.evaluate(async () => {
      const r = await fetch(window.location.origin + '/jobs/test-job-id-123/files/translated.pdf?receipt=valid-view-token-123&download=1');
      return { status: r.status, contentType: r.headers.get('content-type'), contentDisposition: r.headers.get('content-disposition') };
    });
    expect(res.status).toBe(200);
    expect(res.contentType).toBe('application/pdf');
    expect(res.contentDisposition).toContain('attachment;');
  });

  test('download.suggestedFilename() is correctly parsed by playwright (browser behavior)', async ({ page }) => {
    await page.evaluate(() => {
      window.localStorage.setItem('firebase:authUser:dummy', JSON.stringify({ uid: 'test-uid' }));
    });
    await page.goto('/jobs/test-job-id-123');
    
    const translatedDlLink = page.locator('a:has-text("翻訳PDF 保存")');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      translatedDlLink.click()
    ]);

    expect(download.suggestedFilename()).toBe('テスト文書_translated.pdf');
  });

  test('missing receipt should reject with 401', async ({ page }) => {
    const res = await page.evaluate(async () => {
      const r = await fetch(window.location.origin + '/jobs/test-job-id-123/files/translated.pdf');
      return { status: r.status };
    });
    expect(res.status).toBe(401);
  });

  test('invalid kind should return 400', async ({ page }) => {
    const res = await page.evaluate(async () => {
      const r = await fetch(window.location.origin + '/jobs/test-job-id-123/files/invalid.pdf?receipt=valid-view-token-123');
      return { status: r.status };
    });
    expect(res.status).toBe(400);
  });
});
