import { test as teardown } from '@playwright/test';
import { DetectionContextExplorerPage } from '../src/pages/DetectionContextExplorerPage';

teardown('uninstall Detection Translation app', async ({ page }) => {
  const detectionContextExplorerPage = new DetectionContextExplorerPage(page);

  // Clean up by uninstalling the app after all tests complete
  await detectionContextExplorerPage.uninstallApp();
});