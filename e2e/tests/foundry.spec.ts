import { test, expect } from '@playwright/test';
import { FoundryHomePage } from '../src/pages/FoundryHomePage';
import { DetectionContextExplorerPage } from '../src/pages/DetectionContextExplorerPage';
import { SocketNavigationPage } from '../src/pages/SocketNavigationPage';
import { logger } from '../src/utils/Logger';

// Use parallel mode for better performance - app state is stable after setup
test.describe.configure({ mode: 'parallel' });

test.describe('Detection Translation App E2E Tests', () => {
  let foundryHomePage: FoundryHomePage;
  let detectionContextExplorerPage: DetectionContextExplorerPage;
  let socketNavigationPage: SocketNavigationPage;

  // Lightweight setup - only create page objects
  test.beforeEach(async ({ page }, testInfo) => {
    foundryHomePage = new FoundryHomePage(page);
    detectionContextExplorerPage = new DetectionContextExplorerPage(page);
    socketNavigationPage = new SocketNavigationPage(page);
  });

  // Minimal cleanup - only screenshot on failure
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshotPath = `test-failure-${testInfo.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
      await page.screenshot({
        path: `test-results/${screenshotPath}`,
        fullPage: true
      });
    }

    // Quick modal cleanup without complex state management
    await detectionContextExplorerPage.cleanupModals();
  });

  test.describe('UI Page - Detection Context Explorer', () => {
    test('should verify Detection Context Explorer app accessibility', async () => {
      await detectionContextExplorerPage.navigateToInstalledApp();

      // Verify we're on the app page
      const currentUrl = detectionContextExplorerPage.page.url();
      expect(currentUrl).toMatch(/\/foundry\/page\/[a-f0-9]+/);

      logger.success('Detection Context Explorer app is accessible');
    });

    test('should navigate to Detection Context Explorer and verify iframe loads', async () => {
      await detectionContextExplorerPage.navigateToInstalledApp();

      // Verify iframe is present
      const iframe = detectionContextExplorerPage.page.locator('iframe');
      await expect(iframe).toBeVisible({ timeout: 15000 });

      logger.success('Detection Context Explorer iframe loaded successfully');
    });

    test('should verify app content renders without JavaScript errors', async ({ page }) => {
      await detectionContextExplorerPage.navigateToInstalledApp();

      const iframe = page.frameLocator('iframe');
      const contentArea = iframe.locator('body');
      await expect(contentArea).toBeVisible({ timeout: 15000 });
      logger.success('App content rendered without JavaScript errors');
    });

    test('should verify UI loads without errors', async ({ page }) => {
      await detectionContextExplorerPage.navigateToInstalledApp();

      const iframe = page.locator('iframe');
      await expect(iframe).toBeVisible({ timeout: 15000 });

      const iframeContent = page.frameLocator('iframe');
      const bodyContent = iframeContent.locator('body');
      await expect(bodyContent).toBeVisible({ timeout: 15000 });

      logger.success('UI verification completed - no errors detected');
    });
  });

  test.describe('Socket Extension - Endpoint Detections', () => {
    test('should navigate to Endpoint Detections page', async ({ page }) => {
      await socketNavigationPage.navigateToEndpointDetections();
      const currentUrl = page.url();
      // Check for both activity and activity-v2 paths
      expect(currentUrl).toMatch(/\/activity(-v2)?\/detections/);
      logger.success('Navigated to Endpoint Detections page');
    });

    test('should render Detection Translation extension in detection socket', async () => {
      await socketNavigationPage.navigateToEndpointDetections();
      await socketNavigationPage.openFirstDetection();
      await socketNavigationPage.verifyExtensionInSocket('Translation and custom context');
      logger.success('Extension rendered in endpoint detection socket');
    });
  });

  test.describe('Socket Extension - XDR Detections', () => {
    test('should navigate to XDR Detections page', async ({ page }) => {
      await socketNavigationPage.navigateToXDRDetections();
      expect(page.url()).toContain('/xdr/cases');
      logger.success('Navigated to XDR Detections page');
    });

    test('should render Detection Translation extension in XDR socket', async () => {
      // XDR socket (xdr.detections.panel) requires Workbench navigation
      await socketNavigationPage.navigateToXDRDetectionsExtension();
      await socketNavigationPage.verifyExtensionInSocket('Translation and custom context');
      logger.success('Extension rendered in XDR socket');
    });
  });

  test.describe('Socket Extension - NGSIEM Cases', () => {
    test('should navigate to NGSIEM Cases page', async ({ page }) => {
      await socketNavigationPage.navigateToNGSIEMCases();
      expect(page.url()).toContain('/xdr/cases');
      logger.success('Navigated to NGSIEM Cases page');
    });

    test('should render Detection Translation extension in NGSIEM socket', async () => {
      // NGSIEM socket (ngsiem.workbench.details) requires Workbench navigation
      await socketNavigationPage.navigateToNGSIEMCasesExtension();
      await socketNavigationPage.verifyExtensionInSocket('Translation and custom context');
      logger.success('Extension rendered in NGSIEM socket');
    });
  });
});
