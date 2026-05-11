import { test as baseTest } from '@playwright/test';
import { SocketNavigationPage } from '@crowdstrike/foundry-playwright';
import { DetectionContextExplorerPage } from './pages/DetectionContextExplorerPage';

type FoundryFixtures = {
  detectionContextExplorerPage: DetectionContextExplorerPage;
  socketNavigationPage: SocketNavigationPage;
};

export const test = baseTest.extend<FoundryFixtures>({
  detectionContextExplorerPage: async ({ page }, use) => {
    await use(new DetectionContextExplorerPage(page));
  },

  socketNavigationPage: async ({ page }, use) => {
    await use(new SocketNavigationPage(page));
  },
});

export { expect } from '@playwright/test';
