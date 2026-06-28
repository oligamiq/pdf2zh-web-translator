import { Page, Route } from '@playwright/test';

export async function setupApiGuard(page: Page) {
  page.on('response', async (response) => {
    const url = response.url();
    const contentType = response.headers()['content-type'] ?? '';

    if (response.request().resourceType() === 'document') {
      return;
    }

    const looksLikeApi =
      url.includes('/settings') ||
      url.includes('/jobs') ||
      url.includes('/limits') ||
      url.includes('/health/pc-api');

    if (looksLikeApi && contentType.includes('text/html')) {
      throw new Error(`API mock missing: ${url} returned HTML`);
    }
  });
}

export async function setupDefaultApiMocks(page: Page) {
  const fallbackToDocument = (route: Route) => {
    if (route.request().resourceType() === 'document') {
      return route.fallback();
    }
    return route.fulfill({ json: {} });
  };

  await page.route('**/settings/llm', async route => {
    if (route.request().resourceType() === 'document') return route.fallback();
    return route.fulfill({ json: { defaultLanguage: 'ja' } });
  });

  await page.route('**/settings/providers**', async route => {
    if (route.request().resourceType() === 'document') return route.fallback();
    return route.fulfill({ json: [] });
  });

  await page.route('**/settings/api/basic**', async route => {
    if (route.request().resourceType() === 'document') return route.fallback();
    return route.fulfill({ json: { defaultTargetLanguage: 'ja' } });
  });

  await page.route('**/jobs**', async route => {
    if (route.request().resourceType() === 'document') return route.fallback();
    return route.fulfill({ json: { jobs: [] } });
  });

  await page.route('**/limits', async route => {
    if (route.request().resourceType() === 'document') return route.fallback();
    return route.fulfill({ json: { maxPdfSize: 10 * 1024 * 1024, maxDailyPages: 50, remainingPages: 50 } });
  });

  await page.route('**/health/pc-api', async route => {
    if (route.request().resourceType() === 'document') return route.fallback();
    return route.fulfill({ json: { ok: true } });
  });
}
