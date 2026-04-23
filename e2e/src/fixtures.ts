import { test as baseTest } from '@playwright/test';
import {
  FoundryHomePage,
  AppCatalogPage,
  SocketNavigationPage,
  config,
} from '@crowdstrike/foundry-playwright';
import { DetectionContextExplorerPage } from './pages/DetectionContextExplorerPage';

type FoundryFixtures = {
  foundryHomePage: FoundryHomePage;
  appCatalogPage: AppCatalogPage;
  detectionContextExplorerPage: DetectionContextExplorerPage;
  socketNavigationPage: SocketNavigationPage;
  appName: string;
};

export const test = baseTest.extend<FoundryFixtures>({
  foundryHomePage: async ({ page }, use) => {
    await use(new FoundryHomePage(page));
  },

  appCatalogPage: async ({ page }, use) => {
    await use(new AppCatalogPage(page));
  },

  detectionContextExplorerPage: async ({ page }, use) => {
    await use(new DetectionContextExplorerPage(page));
  },

  socketNavigationPage: async ({ page }, use) => {
    await use(new SocketNavigationPage(page));
  },

  appName: async ({}, use) => {
    await use(config.appName);
  },
});

export { expect } from '@playwright/test';
