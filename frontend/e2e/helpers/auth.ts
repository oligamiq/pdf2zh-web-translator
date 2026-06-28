import { Page } from '@playwright/test';

export async function setupAuthenticatedUser(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('e2e_token', 'mock-valid-token');
    sessionStorage.setItem('e2e_user_email', 'test@example.com');
    (window as any).turnstile = {
      render: (container: string, options: any) => {
        setTimeout(() => options.callback('mock-turnstile-token'), 100);
        return 'widget-id';
      },
      reset: () => {},
    };
  });
}
