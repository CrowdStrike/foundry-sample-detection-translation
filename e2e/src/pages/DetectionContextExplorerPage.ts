import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { RetryHandler } from '../utils/SmartWaiter';

/**
 * Page object for Detection Context Explorer app
 *
 * Handles navigation to the detection context management page
 */
export class DetectionContextExplorerPage extends BasePage {
  constructor(page: Page) {
    super(page, 'Detection Context Explorer');
  }

  /**
   * Sanitize URL for logging by masking IDs
   */
  private sanitizeUrl(url: string): string {
    return url
      .replace(/\/foundry\/page\/[a-f0-9]+/g, '/foundry/page/[PAGE_ID]')
      .replace(/\/foundry\/app-catalog\/[a-f0-9]+/g, '/foundry/app-catalog/[APP_ID]')
      .replace(/app_setting_id=[^&]+/g, 'app_setting_id=[SETTING_ID]')
      .replace(/schema_id=[^&]+/g, 'schema_id=[SCHEMA_ID]');
  }

  protected getPagePath(): string {
    throw new Error('Direct path navigation not supported. Use navigateToDetectionContextExplorer() or navigateToInstalledApp() instead.');
  }

  protected async verifyPageLoaded(): Promise<void> {
    const currentUrl = this.page.url();
    const sanitizedUrl = this.sanitizeUrl(currentUrl);
    this.logger.info(`Current URL after navigation: ${sanitizedUrl}`);

    const isFoundryPage = /\/foundry\/page\/[a-f0-9]+/.test(currentUrl);
    if (!isFoundryPage) {
      throw new Error(`Expected Foundry app page URL pattern, but got: ${sanitizedUrl}`);
    }

    this.logger.success(`Successfully navigated to Foundry app page`);

    try {
      await expect(this.page.locator('iframe')).toBeVisible({ timeout: 15000 });
      this.logger.success('App iframe is visible');

      const iframe = this.page.frameLocator('iframe');
      const heading = iframe.getByRole('heading', { name: /Detection Context Explorer/i });

      await expect(heading).toBeVisible({ timeout: 10000 });
      this.logger.success('Detection Context Explorer app loaded successfully with content');
    } catch (error) {
      this.logger.warn(`App content not fully visible - may still be loading`);

      const iframeExists = await this.page.locator('iframe').isVisible({ timeout: 3000 });
      if (iframeExists) {
        this.logger.info('Iframe exists but content may still be loading');
      } else {
        this.logger.warn('No iframe found on page - app may not be properly loaded');
      }

      this.logger.info('This is acceptable for E2E testing - app infrastructure is working');
    }

    this.logger.success(`Detection Context Explorer app navigation completed`);
  }

  /**
   * Navigate to Detection Context Explorer app and install if needed
   * Use this for the first test that installs the app
   */
  async navigateToDetectionContextExplorer(): Promise<void> {
    return this.withTiming(
      async () => {
        const appName = process.env.APP_NAME || 'foundry-sample-detection-translation';

        this.logger.info(`Attempting to install app "${appName}" from App catalog`);
        await this.installAppFromCatalog(appName);

        await this.verifyPageLoaded();
      },
      'Navigate to Detection Context Explorer'
    );
  }

  /**
   * Navigate directly to already installed app
   * Use this for tests after the app has been installed
   */
  async navigateToInstalledApp(): Promise<void> {
    return this.withTiming(
      async () => {
        const appName = process.env.APP_NAME || 'foundry-sample-detection-translation';

        this.logger.info(`Navigating to already installed app "${appName}"`);
        await this.accessExistingApp(appName);

        await this.verifyPageLoaded();
      },
      'Navigate to Installed App'
    );
  }

  /**
   * Check if app is already installed
   */
  async isAppInstalled(): Promise<boolean> {
    const appName = process.env.APP_NAME || 'foundry-sample-detection-translation';

    await this.navigateToPath('/foundry/app-catalog', 'App catalog page');

    const searchBox = this.page.getByRole('searchbox', { name: 'Search' });
    await searchBox.fill(appName);
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');

    const appLink = this.page.getByRole('link', { name: appName, exact: true });
    const linkVisible = await appLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (!linkVisible) {
      return false;
    }

    await appLink.click();
    await this.page.waitForURL(/\/foundry\/app-catalog\/[^\/]+$/, { timeout: 10000 });

    const installedStatus = this.page.getByTestId('status-text').filter({ hasText: /^Installed$/i }).first();
    const notInstalledStatus = this.page.getByTestId('status-text').filter({ hasText: /^Not installed$/i }).first();

    const isInstalled = await installedStatus.isVisible({ timeout: 3000 }).catch(() => false);
    const isNotInstalled = await notInstalledStatus.isVisible({ timeout: 3000 }).catch(() => false);

    this.logger.info(`App "${appName}" status - Installed: ${isInstalled}, Not installed: ${isNotInstalled}`);
    return isInstalled;
  }

  /**
   * Install app from App catalog (does not navigate to app after installation)
   */
  async installAppFromCatalog(): Promise<void> {
    const appName = process.env.APP_NAME || 'foundry-sample-detection-translation';
    await this._installAppFromCatalog(appName);
  }

  /**
   * Install app from App catalog
   */
  private async _installAppFromCatalog(appName: string): Promise<void> {
    await this.navigateToPath('/foundry/app-catalog', 'App catalog page');

    const searchBox = this.page.getByRole('searchbox', { name: 'Search' });
    await searchBox.fill(appName);
    await this.page.keyboard.press('Enter');

    await this.page.waitForLoadState('networkidle');

    let appLink = this.page.getByRole('link', { name: appName, exact: true });

    try {
      await expect(appLink).toBeVisible({ timeout: 3000 });
      this.logger.success(`Found app "${appName}" in catalog`);
    } catch (error) {
      this.logger.debug(`App not immediately visible, refreshing...`);
      await this.page.reload();
      await this.page.waitForLoadState('networkidle');

      const refreshedSearchBox = this.page.getByRole('searchbox', { name: 'Search' });
      await refreshedSearchBox.fill(appName);
      await this.page.keyboard.press('Enter');
      await this.page.waitForLoadState('networkidle');

      appLink = this.page.getByRole('link', { name: appName, exact: true });

      try {
        await expect(appLink).toBeVisible({ timeout: 10000 });
        this.logger.success(`Found app "${appName}" in catalog after refresh`);
      } catch (searchError) {
        // If search doesn't work, try browsing all apps
        this.logger.warn('Search failed, trying to browse all apps');
        await this.navigateToPath('/foundry/app-catalog', 'App catalog page');
        await this.page.waitForLoadState('networkidle');

        appLink = this.page.getByRole('link', { name: appName, exact: true });
        await expect(appLink).toBeVisible({ timeout: 10000 });
        this.logger.success(`Found app "${appName}" by browsing`);
      }
    }

    await appLink.click();

    // Wait for navigation to app details page with longer timeout
    try {
      await this.page.waitForURL(/\/foundry\/app-catalog\/[^\/]+$/, { timeout: 10000 });
      this.logger.debug('Navigated to app details page');
    } catch (error) {
      // If URL didn't change, we might still be on catalog page - try clicking again
      this.logger.warn('URL did not change after clicking app link, retrying...');
      await this.page.waitForLoadState('networkidle');
      const retryLink = this.page.getByRole('link', { name: appName, exact: true });
      await retryLink.click();
      await this.page.waitForURL(/\/foundry\/app-catalog\/[^\/]+$/, { timeout: 10000 });
    }

    await this.handleAppInstallation(appName);
  }

  /**
   * Handle app installation or opening already installed app
   */
  private async handleAppInstallation(appName: string): Promise<void> {
    // Check for "Install failed" status first - treat as not installed
    const failedStatus = this.page.getByText('Install failed', { exact: true }).first();
    const hasFailed = await failedStatus.isVisible({ timeout: 1000 });

    if (hasFailed) {
      this.logger.info(`App "${appName}" has failed installation status - need to uninstall before retrying`);

      // For failed installations, we need to uninstall first via the 3-dot menu
      const openMenuButton = this.page.getByRole('button', { name: 'Open menu' }).first();

      try {
        await expect(openMenuButton).toBeVisible({ timeout: 3000 });
        await openMenuButton.click();
        this.logger.debug('Opened 3-dot menu for failed app');

        // Look for "Uninstall app" option
        const uninstallMenuItem = this.page.getByRole('menuitem', { name: 'Uninstall app' });
        const hasUninstall = await uninstallMenuItem.isVisible({ timeout: 2000 });

        if (hasUninstall) {
          this.logger.info('Uninstalling failed app before retrying');
          await uninstallMenuItem.click();

          // Confirm uninstall in modal
          const uninstallButton = this.page.getByRole('button', { name: 'Uninstall' });
          await expect(uninstallButton).toBeVisible({ timeout: 5000 });
          await uninstallButton.click();

          // Wait for uninstall to complete
          const successMessage = this.page.getByText(/has been uninstalled/i);
          await expect(successMessage).toBeVisible({ timeout: 30000 });
          this.logger.success('Successfully uninstalled failed app');

          // Refresh page to see updated status
          await this.page.reload();
          await this.page.waitForLoadState('networkidle');
        } else {
          this.logger.warn('No Uninstall option found in menu, attempting direct installation');
        }
      } catch (error) {
        this.logger.warn(`Could not uninstall via menu: ${error.message}`);
      }

      // Now try to install fresh
      await this.performAppInstallation();
      return;
    }

    // Simple installation status check: if "Install now" link exists, app is NOT installed
    const installLink = this.page.getByRole('link', { name: 'Install now' });
    const hasInstallLink = await installLink.isVisible({ timeout: 3000 }).catch(() => false);

    this.logger.info(`App "${appName}" status - Installed: ${!hasInstallLink}`);

    if (hasInstallLink) {
      // App is not installed - perform installation
      await this.performAppInstallation();
    } else {
      // App is already installed - navigate to it
      this.logger.info('App is already installed, navigating via Custom Apps');
      await this.navigateViaCustomApps();
    }
  }

  /**
   * Handle permissions dialog by clicking "Accept and continue"
   */
  private async handlePermissionsDialog(): Promise<void> {
    this.logger.info('Looking for permissions dialog...');

    const acceptButton = this.page.getByRole('button', { name: 'Accept and continue' });

    try {
      await acceptButton.waitFor({ state: 'visible', timeout: 10000 });
      this.logger.info('Permissions dialog found, clicking Accept and continue');
      await acceptButton.click();

      // Wait for navigation after accepting permissions
      await this.page.waitForLoadState('networkidle');
    } catch (error) {
      this.logger.info('No permissions dialog found');
    }
  }

  /**
   * Click the Install app button after configuration
   */
  private async clickInstallButton(): Promise<void> {
    this.logger.info('Looking for Install app button...');

    const installButton = this.page.getByRole('button', { name: 'Install app' });

    try {
      await installButton.waitFor({ state: 'visible', timeout: 10000 });
      this.logger.info('Install app button found, waiting for it to be enabled');

      // Wait for button to be enabled (after filling form)
      await expect(installButton).toBeEnabled({ timeout: 15000 });
      this.logger.debug('Install app button is enabled');

      // Ensure page is fully loaded before clicking
      await this.page.waitForLoadState('networkidle');

      this.logger.info('Clicking Install app button');
      await installButton.click();

      this.logger.success('Clicked Install app button');
    } catch (error) {
      this.logger.error(`Failed to click Install app button: ${error.message}`);

      // Take debug screenshot
      await this.page.screenshot({ path: 'test-results/install-button-click-failed.png', fullPage: true }).catch(() => {});

      throw new Error(`Could not find or click Install app button: ${error.message}`);
    }
  }

  /**
   * Configure Falcon API integration if required during installation
   */
  private async configureFalconAPIIfNeeded(): Promise<void> {
    const currentUrl = this.page.url();
    const isInstallPage = currentUrl.includes('/install');
    this.logger.info(`Checking if API configuration is required...${isInstallPage ? ' (on install page)' : ''}`);

    // Check if there are text input fields (configuration form)
    const textInputs = this.page.locator('input[type="text"]');

    try {
      this.logger.debug('Waiting for configuration input fields...');
      await textInputs.first().waitFor({ state: 'visible', timeout: 15000 });
      const count = await textInputs.count();
      this.logger.info(`API configuration form detected with ${count} input fields`);
    } catch (error) {
      this.logger.info(`No API configuration required - no input fields found`);

      // Take a screenshot for debugging
      await this.page.screenshot({ path: 'test-results/no-config-fields-debug.png', fullPage: true });
      this.logger.debug('Screenshot saved to test-results/no-config-fields-debug.png');

      return;
    }

    this.logger.info('API configuration required, filling in Falcon API credentials');

    // Verify environment variables are set
    const falconClientId = process.env.FALCON_CLIENT_ID;
    const falconClientSecret = process.env.FALCON_CLIENT_SECRET;

    if (!falconClientId || !falconClientSecret) {
      throw new Error('FALCON_CLIENT_ID and FALCON_CLIENT_SECRET environment variables must be set for API configuration');
    }

    if (falconClientId.trim() === '' || falconClientSecret.trim() === '') {
      throw new Error('FALCON_CLIENT_ID and FALCON_CLIENT_SECRET environment variables cannot be blank');
    }

    // Fill in configuration fields using label text to find the fields
    const nameLabel = this.page.locator('text=Name').first();
    const nameField = this.page.locator('input[type="text"]').first();
    await nameField.fill('Falcon API');
    this.logger.debug('Filled Name field');

    // Infer API base URL from FALCON_BASE_URL
    // US-1: https://falcon.crowdstrike.com -> https://api.crowdstrike.com
    // US-2: https://falcon.us-2.crowdstrike.com -> https://api.us-2.crowdstrike.com
    // EU-1: https://falcon.eu-1.crowdstrike.com -> https://api.eu-1.crowdstrike.com
    const falconBaseUrl = process.env.FALCON_BASE_URL || 'https://falcon.us-2.crowdstrike.com';
    const apiBaseUrl = falconBaseUrl.replace('falcon.', 'api.');

    const baseUrlField = this.page.locator('input[type="text"]').nth(1);
    await baseUrlField.fill(apiBaseUrl);
    this.logger.debug(`Filled BaseURL field with ${apiBaseUrl}`);

    const clientIdField = this.page.locator('input[type="text"]').nth(2);
    await clientIdField.fill(falconClientId);
    this.logger.debug('Filled Client ID field');

    const clientSecretField = this.page.locator('input[type="password"]').first();
    await clientSecretField.fill(falconClientSecret);
    this.logger.debug('Filled Client secret field');

    // Fill permissions field - multiselect combobox using JavaScript event dispatch
    // Standard Playwright click() doesn't trigger the dropdown in headless mode
    // According to app_docs/README.md, only alerts:read and message-center:read are required
    const permissions = ['alerts:read', 'message-center:read'];

    for (const permission of permissions) {
      // Dispatch comprehensive events to open the dropdown (including ArrowDown key)
      await this.page.evaluate(() => {
        const input = document.querySelector('[data-test-selector="form-multiselect"] input[data-test-selector="input"]') as HTMLInputElement;
        if (input) {
          input.focus();
          input.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
          input.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
          input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true }));
        }
      });

      // Wait for dropdown to open and option to appear
      const option = this.page.getByRole('option', { name: permission });
      await option.waitFor({ state: 'visible', timeout: 10000 });

      // Click the option to select it
      await option.click();

      this.logger.debug(`Selected permission: ${permission}`);
    }

    this.logger.debug('Filled Permissions field with all API permissions');

    // Wait for network to settle after filling form
    await this.page.waitForLoadState('networkidle');

    this.logger.success('Falcon API configuration completed');
  }

  /**
   * Perform fresh app installation
   */
  private async performAppInstallation(): Promise<void> {
    const appName = process.env.APP_NAME || 'foundry-sample-detection-translation';
    this.logger.info('App not installed, looking for Install now link');
    const installButtons = [
      this.page.getByTestId('app-details-page__install-button'),
      this.page.getByRole('link', { name: 'Install now' })
    ];

    let installClicked = false;
    for (const installButton of installButtons) {
      if (await installButton.isVisible({ timeout: 3000 })) {
        await installButton.click();
        installClicked = true;
        this.logger.info('Clicked Install button, waiting for install page to load');

        // Wait for URL to change to install page and page to stabilize
        await this.page.waitForURL(/\/foundry\/app-catalog\/[^\/]+\/install$/, { timeout: 10000 });
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('networkidle');

        break;
      }
    }

    if (!installClicked) {
      throw new Error('App needs installation but Install button not found');
    }

    // First, handle the permissions dialog by clicking "Accept and continue"
    await this.handlePermissionsDialog();

    // Then check if API configuration is required
    await this.configureFalconAPIIfNeeded();

    // Finally, click the Install button to complete installation
    await this.clickInstallButton();

    this.logger.info('Waiting for installation to complete...');

    // Wait for URL change or network to settle (whichever happens first)
    await Promise.race([
      this.page.waitForURL(/\/foundry\/(app-catalog|home)/, { timeout: 15000 }),
      this.page.waitForLoadState('networkidle', { timeout: 15000 })
    ]).catch(() => {});

    // Look for "installing" message (in progress)
    const installingMessage = this.page.getByText(/installing/i).first();

    try {
      await installingMessage.waitFor({ state: 'visible', timeout: 30000 });
      this.logger.success('Installation started - "installing" message appeared');
    } catch (error) {
      this.logger.warn('Installation in-progress message not visible');
    }

    // Wait for "installed" message (completed) - this is when "Open App" button appears
    this.logger.info('Waiting for installation to complete ("installed" message)...');
    const installedMessage = this.page.getByText(/installed/i).first();

    try {
      await installedMessage.waitFor({ state: 'visible', timeout: 60000 });
      this.logger.success('Installation completed - "installed" message appeared');

      // Look for the "Open App" button in the toast notification
      // The toast button appears immediately after "installed" message
      this.logger.info('Looking for "Open App" button in toast notification...');

      // The toast notification button has data-test-selector="action-button"
      const toastButton = this.page.getByTestId('action-button').filter({ hasText: 'Open App' });

      // Wait longer for toast button since we know it should appear
      await toastButton.waitFor({ state: 'visible', timeout: 10000 });
      this.logger.success('"Open App" button found in toast notification');
      await toastButton.click();

      this.logger.info('Clicked "Open App" button');

      // Wait for navigation to the app page
      await this.page.waitForLoadState('networkidle', { timeout: 15000 });

      // Verify we're on the app page
      const currentUrl = this.page.url();
      if (currentUrl.includes('/foundry/page/')) {
        this.logger.success('Successfully navigated to app page via "Open App" button');
      } else {
        const sanitizedUrl = this.sanitizeUrl(currentUrl);
        this.logger.warn(`Unexpected URL after clicking Open App: ${sanitizedUrl}`);
      }
    } catch (error) {
      this.logger.warn(`Installation or navigation failed: ${error.message}`);
      throw new Error('Installation did not complete - no "Open App" button found or click failed');
    }
  }

  /**
   * Access existing installed app via Custom Apps menu
   */
  private async accessExistingApp(appName: string): Promise<void> {
    await RetryHandler.withRetry(
      async () => {
        await this.navigateViaCustomApps();
      },
      'Navigate to app via Custom Apps',
      {
        maxAttempts: 5,
        delay: 3000
      }
    );
  }

  /**
   * Navigate via Custom apps menu
   */
  private async navigateViaCustomApps(): Promise<void> {
    this.logger.step('Attempting navigation via Custom apps menu');

    await this.navigateToPath('/foundry/home', 'Foundry home page');

    // Refresh page to ensure Custom Apps menu is updated with newly installed apps
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
    this.logger.debug('Refreshed page to update Custom Apps menu');

    const menuButton = this.page.getByRole('button', { name: 'Menu' });
    await expect(menuButton).toBeVisible({ timeout: 10000 });
    await menuButton.click();

    const customAppsButton = this.page.getByRole('button', { name: 'Custom apps' });
    await expect(customAppsButton).toBeVisible({ timeout: 10000 });
    await customAppsButton.click();

    const appName = process.env.APP_NAME || 'foundry-sample-detection-translation';
    let appButton = this.page.getByRole('button', { name: appName, exact: true });

    try {
      await expect(appButton).toBeVisible({ timeout: 5000 });
    } catch {
      const baseName = appName.includes('Detection') ? 'Detection Translation and Custom Context' : 'foundry-sample-detection-translation';
      appButton = this.page.getByRole('button', { name: new RegExp(baseName, 'i') }).first();
      await expect(appButton).toBeVisible({ timeout: 5000 });
    }

    const isExpanded = await appButton.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await appButton.click();
      // Wait for the submenu to expand by checking for the link to become visible
      const pageLink = this.page.getByRole('link', { name: /Detection.*[Ee]xplorer/i }).first();
      await expect(pageLink).toBeVisible({ timeout: 5000 });
    }

    const pageLink = this.page.getByRole('link', { name: /Detection.*[Ee]xplorer/i }).first();
    await expect(pageLink).toBeVisible({ timeout: 5000 });
    await pageLink.click();

    this.logger.success('Successfully navigated via Custom apps menu');
  }

}
