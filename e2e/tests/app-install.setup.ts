import { test as setup } from '@playwright/test';
import { FoundryHomePage } from '../src/pages/FoundryHomePage';
import { DetectionContextExplorerPage } from '../src/pages/DetectionContextExplorerPage';

setup('install Detection Translation app', async ({ page }) => {
  const foundryHomePage = new FoundryHomePage(page);
  const detectionContextExplorerPage = new DetectionContextExplorerPage(page);

  await foundryHomePage.goto();

  const isInstalled = await detectionContextExplorerPage.isAppInstalled();

  if (!isInstalled) {
    console.log('App is not installed. Installing...');
    await detectionContextExplorerPage.installAppFromCatalog();
    console.log('App installed successfully');
  } else {
    console.log('App is already installed - skipping installation');
  }
});
