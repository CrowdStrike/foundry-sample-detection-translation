import { Page, expect } from '@playwright/test';
import { BasePage, AppCatalogPage, config } from '@crowdstrike/foundry-playwright';

export class DetectionContextExplorerPage extends BasePage {
  constructor(page: Page) {
    super(page, 'Detection Context Explorer');
  }

  protected getPagePath(): string {
    throw new Error('Direct path navigation not supported. Use navigateToApp() instead.');
  }

  protected async verifyPageLoaded(): Promise<void> {
    const currentUrl = this.page.url();
    const isFoundryPage = /\/foundry\/page\/[a-f0-9]+/.test(currentUrl);
    if (!isFoundryPage) {
      throw new Error(`Expected Foundry app page URL pattern`);
    }

    try {
      await expect(this.page.locator('iframe[name="portal"]')).toBeVisible({ timeout: 15000 });
      const iframe = this.page.frameLocator('iframe[name="portal"]');
      const heading = iframe.getByRole('heading', { name: /Detection Context Explorer/i });
      await expect(heading).toBeVisible({ timeout: 10000 });
    } catch {
      this.logger.warn('App content not fully visible - may still be loading');
    }
  }

  async navigateToApp(): Promise<void> {
    return this.withTiming(async () => {
      const catalog = new AppCatalogPage(this.page);
      await catalog.navigateToInstalledApp(config.appName);
      await this.verifyPageLoaded();
    }, 'Navigate to Detection Context Explorer');
  }
}
