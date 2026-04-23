import { test as setup } from '@playwright/test';
import { AppCatalogPage, config } from '@crowdstrike/foundry-playwright';

setup('install app', async ({ page }) => {
  const falconClientId = process.env.FALCON_CLIENT_ID;
  const falconClientSecret = process.env.FALCON_CLIENT_SECRET;
  const falconBaseUrl = process.env.FALCON_BASE_URL || 'https://falcon.us-2.crowdstrike.com';
  if (!falconClientId || !falconClientSecret) {
    throw new Error('Missing required env vars: FALCON_CLIENT_ID, FALCON_CLIENT_SECRET');
  }

  const apiBaseUrl = falconBaseUrl.replace('falcon.', 'api.');

  const catalog = new AppCatalogPage(page);
  await catalog.installApp(config.appName, {
    configureSettings: async (page) => {
      await page.getByLabel('Name').first().fill('Falcon API');
      await page.getByLabel('BaseURL').fill(apiBaseUrl);
      await page.getByLabel('Client ID').fill(falconClientId);
      await page.getByLabel('Client secret').fill(falconClientSecret);

      const permissions = ['alerts:read', 'message-center:read'];
      for (const permission of permissions) {
        await page.evaluate(() => {
          const input = document.querySelector('[data-test-selector="form-multiselect"] input[data-test-selector="input"]') as HTMLInputElement;
          if (input) {
            input.focus();
            input.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
            input.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true }));
          }
        });

        const option = page.getByRole('option', { name: permission });
        await option.waitFor({ state: 'visible', timeout: 10000 });
        await option.click();
      }

      await page.waitForLoadState('domcontentloaded');
    },
  });
});
