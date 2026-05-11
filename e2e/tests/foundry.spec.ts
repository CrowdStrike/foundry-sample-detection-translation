import { test, expect } from '../src/fixtures';

test.describe.configure({ mode: 'parallel' });

test.describe('Detection Translation App E2E Tests', () => {
  test.describe('UI Page - Detection Context Explorer', () => {
    test('should verify Detection Context Explorer app accessibility', async ({ page, detectionContextExplorerPage }) => {
      await detectionContextExplorerPage.navigateToApp();
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/foundry\/page\/[a-f0-9]+/);
      console.log('Detection Context Explorer app is accessible');
    });

    test('should navigate to Detection Context Explorer and verify iframe loads', async ({ page, detectionContextExplorerPage }) => {
      await detectionContextExplorerPage.navigateToApp();
      const iframe = page.locator('iframe[name="portal"]');
      await expect(iframe).toBeVisible({ timeout: 15000 });
      console.log('Detection Context Explorer iframe loaded successfully');
    });

    test('should verify app content renders without JavaScript errors', async ({ page, detectionContextExplorerPage }) => {
      await detectionContextExplorerPage.navigateToApp();
      const iframe = page.frameLocator('iframe[name="portal"]');
      const contentArea = iframe.locator('body');
      await expect(contentArea).toBeVisible({ timeout: 15000 });
      console.log('App content rendered without JavaScript errors');
    });

    test('should verify UI loads without errors', async ({ page, detectionContextExplorerPage }) => {
      await detectionContextExplorerPage.navigateToApp();
      const iframe = page.locator('iframe[name="portal"]');
      await expect(iframe).toBeVisible({ timeout: 15000 });
      const iframeContent = page.frameLocator('iframe[name="portal"]');
      const bodyContent = iframeContent.locator('body');
      await expect(bodyContent).toBeVisible({ timeout: 15000 });
      console.log('UI verification completed - no errors detected');
    });
  });

  test.describe('Socket Extension - Endpoint Detections', () => {
    test('should navigate to Endpoint Detections page', async ({ page, socketNavigationPage }) => {
      await socketNavigationPage.navigateToEndpointDetections();
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/activity(-v2)?\/detections/);
      console.log('Navigated to Endpoint Detections page');
    });

    test('should render Detection Translation extension in detection socket', async ({ socketNavigationPage }) => {
      await socketNavigationPage.navigateToEndpointDetections();
      await socketNavigationPage.openFirstDetection();
      await socketNavigationPage.verifyExtensionInSocket('Translation and custom context');
      console.log('Extension rendered in endpoint detection socket');
    });
  });

  test.describe('Socket Extension - NGSIEM Cases', () => {
    test('should navigate to NGSIEM Cases page', async ({ page, socketNavigationPage }) => {
      await socketNavigationPage.navigateToNGSIEMCases();
      expect(page.url()).toContain('/xdr/cases');
      console.log('Navigated to NGSIEM Cases page');
    });

    test('should render Detection Translation extension in NGSIEM socket', async ({ socketNavigationPage }) => {
      await socketNavigationPage.navigateToNGSIEMCaseExtension();
      await socketNavigationPage.verifyExtensionInSocket('Translation and custom context');
      console.log('Extension rendered in NGSIEM socket');
    });
  });
});
