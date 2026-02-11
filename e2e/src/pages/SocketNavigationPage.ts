import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { config } from '../config/TestConfig';

/**
 * Utility page object for navigating to detection pages with socket extensions
 *
 * Uses menu-based navigation to ensure reliability when URLs change.
 *
 * Supports testing Foundry extensions that appear in detection sockets:
 * - activity.detections.details (Endpoint Detections)
 * - xdr.detections.panel (XDR Detections)
 * - ngsiem.workbench.details (NGSIEM Incidents)
 */
export class SocketNavigationPage extends BasePage {
  constructor(page: Page) {
    super(page, 'Socket Navigation');
  }

  protected getPagePath(): string {
    throw new Error('Socket navigation does not have a direct path - use menu navigation');
  }

  protected async verifyPageLoaded(): Promise<void> {
  }

  /**
   * Navigate to Endpoint Detections page (activity.detections.details socket)
   * Uses menu navigation: Menu → Endpoint security → Monitor → Endpoint detections
   */
  async navigateToEndpointDetections(): Promise<void> {
    return this.withTiming(
      async () => {
        this.logger.info('Navigating to Endpoint Detections page');

        // Navigate to Foundry home first to ensure menu is available
        await this.navigateToPath('/foundry/home', 'Foundry home');
        await this.page.waitForLoadState('networkidle');

        // Open the hamburger menu
        const menuButton = this.page.getByTestId('nav-trigger');
        await menuButton.waitFor({ state: 'visible', timeout: 30000 });
        await menuButton.click();
        await this.page.waitForLoadState('networkidle');

        // Click "Endpoint security"
        const navigation = this.page.getByRole('navigation');
        const endpointSecurityButton = navigation.getByRole('button', { name: /Endpoint security/ });
        await endpointSecurityButton.click();
        await this.waiter.delay(500);

        // Click "Monitor" to expand submenu (if not already expanded)
        const monitorButton = this.page.getByRole('button', { name: /^Monitor$/i });
        await monitorButton.waitFor({ state: 'visible', timeout: 10000 }); // Wait for menu to stabilize
        const isExpanded = await monitorButton.getAttribute('aria-expanded');
        if (isExpanded !== 'true') {
          await monitorButton.click();
          await this.waiter.delay(500);
        }

        // Click "Endpoint detections" link
        const endpointDetectionsLink = this.page.getByRole('link', { name: /Endpoint detections/i });
        await endpointDetectionsLink.click();

        // Wait for page to load
        await this.page.waitForLoadState('networkidle');

        // Verify we're on the detections page by looking for the page heading
        const pageTitle = this.page.locator('h1, h2').filter({ hasText: /Detections/i }).first();
        await expect(pageTitle).toBeVisible({ timeout: 10000 });

        this.logger.success('Navigated to Endpoint Detections page');
      },
      'Navigate to Endpoint Detections'
    );
  }

  /**
   * Navigate to XDR Detections page (xdr.detections.panel socket)
   *
   * Note: Despite the socket name "xdr.detections.panel", this socket actually appears
   * on the Incidents page at /xdr/incidents (same as ngsiem.workbench.details).
   * The extension requires navigating to the Workbench view and clicking on a graph node.
   *
   * Uses menu navigation: Menu → Next-Gen SIEM → Incidents
   */
  async navigateToXDRDetections(): Promise<void> {
    return this.withTiming(
      async () => {
        this.logger.info('Navigating to XDR Detections page (Incidents)');

        // Navigate to Foundry home first to ensure menu is available
        await this.navigateToPath('/foundry/home', 'Foundry home');
        await this.page.waitForLoadState('networkidle');

        // Open the hamburger menu
        const menuButton = this.page.getByTestId('nav-trigger');
        await menuButton.waitFor({ state: 'visible', timeout: 30000 });
        await menuButton.click();
        await this.page.waitForLoadState('networkidle');

        // Click "Next-Gen SIEM" in the menu (not the home page card)
        const ngsiemButton = this.page.getByTestId('popout-button').filter({ hasText: /Next-Gen SIEM/i });
        await ngsiemButton.click();
        await this.page.waitForLoadState('networkidle');

        // Click "Incidents" - use test selector with explicit wait for menu to stabilize
        const incidentsLink = this.page.getByTestId('section-link').filter({ hasText: /Incidents/i });
        await incidentsLink.waitFor({ state: 'visible', timeout: 10000 });
        await incidentsLink.click();

        await this.page.waitForLoadState('networkidle');

        const pageTitle = this.page.locator('h1, [role="heading"]').first();
        await expect(pageTitle).toBeVisible({ timeout: 10000 });

        this.logger.success('Navigated to XDR Detections page (Incidents)');
      },
      'Navigate to XDR Detections'
    );
  }

  /**
   * Navigate to XDR Detections extension via Workbench
   * The xdr.detections.panel socket requires selecting a graph node in the Workbench
   */
  async navigateToXDRDetectionsExtension(): Promise<void> {
    return this.withTiming(
      async () => {
        this.logger.info('Navigating to XDR extension in Workbench');

        // Navigate to XDR detections page (Incidents)
        await this.navigateToXDRDetections();

        // Wait for incidents to load
        await this.page.waitForLoadState('networkidle');

        // Click on first incident to open details panel
        const firstIncidentButton = this.page.locator('[role="gridcell"] button').first();
        await firstIncidentButton.waitFor({ state: 'visible', timeout: 10000 });
        await firstIncidentButton.click();

        // Wait for incident details to load
        await this.page.waitForLoadState('networkidle');

        // Navigate to full incident (Workbench view)
        const seeFullIncidentLink = this.page.getByRole('link', { name: 'See full incident' });
        await seeFullIncidentLink.waitFor({ state: 'visible', timeout: 10000 });
        await seeFullIncidentLink.click();
        this.logger.debug('Clicked See full incident link');

        // Wait for workbench to load
        await this.page.waitForLoadState('networkidle');

        // Use graph search to select a node (extension only appears when a node is selected)
        await this.clickGraphNode();

        this.logger.success('Navigated to XDR Workbench with extension visible');
      },
      'Navigate to XDR Detections Extension'
    );
  }

  /**
   * Navigate to NGSIEM Incidents page (ngsiem.workbench.details socket)
   * Uses menu navigation: Menu → Next-Gen SIEM → Incidents
   */
  async navigateToNGSIEMIncidents(): Promise<void> {
    return this.withTiming(
      async () => {
        this.logger.info('Navigating to NGSIEM Incidents page');

        // Navigate to Foundry home first to ensure menu is available
        await this.navigateToPath('/foundry/home', 'Foundry home');
        await this.page.waitForLoadState('networkidle');

        // Open the hamburger menu
        const menuButton = this.page.getByTestId('nav-trigger');
        await menuButton.waitFor({ state: 'visible', timeout: 30000 });
        await menuButton.click();
        await this.page.waitForLoadState('networkidle');

        // Click "Next-Gen SIEM" in the menu (not the home page card)
        const ngsiemButton = this.page.getByTestId('popout-button').filter({ hasText: /Next-Gen SIEM/i });
        await ngsiemButton.click();
        await this.page.waitForLoadState('networkidle');

        // Click "Incidents" - use test selector with explicit wait for menu to stabilize
        const incidentsLink = this.page.getByTestId('section-link').filter({ hasText: /Incidents/i });
        await incidentsLink.waitFor({ state: 'visible', timeout: 10000 });
        await incidentsLink.click();

        await this.page.waitForLoadState('networkidle');

        const pageTitle = this.page.locator('h1, [role="heading"]').first();
        await expect(pageTitle).toBeVisible({ timeout: 10000 });

        this.logger.success('Navigated to NGSIEM Incidents page');
      },
      'Navigate to NGSIEM Incidents'
    );
  }

  /**
   * Navigate to NGSIEM Incidents extension via Workbench
   * The ngsiem.workbench.details socket requires selecting a graph node in the Workbench
   */
  async navigateToNGSIEMIncidentsExtension(): Promise<void> {
    return this.withTiming(
      async () => {
        this.logger.info('Navigating to NGSIEM extension in Workbench');

        // Navigate to NGSIEM incidents page
        await this.navigateToNGSIEMIncidents();

        // Wait for incidents to load
        await this.page.waitForLoadState('networkidle');

        // Click on first incident to open details panel
        const firstIncidentButton = this.page.locator('[role="gridcell"] button').first();
        await firstIncidentButton.waitFor({ state: 'visible', timeout: 10000 });
        await firstIncidentButton.click();

        // Wait for incident details to load
        await this.page.waitForLoadState('networkidle');

        // Navigate to full incident (Workbench view)
        const seeFullIncidentLink = this.page.getByRole('link', { name: 'See full incident' });
        await seeFullIncidentLink.waitFor({ state: 'visible', timeout: 10000 });
        await seeFullIncidentLink.click();
        this.logger.debug('Clicked See full incident link');

        // Wait for workbench to load
        await this.page.waitForLoadState('networkidle');

        // Use graph search to select a node (extension only appears when a node is selected)
        await this.clickGraphNode();

        this.logger.success('Navigated to NGSIEM Workbench with extension visible');
      },
      'Navigate to NGSIEM Incidents Extension'
    );
  }

  /**
   * Use the graph search feature to select a node
   * The extension panel only appears when a node is selected in the workbench
   */
  private async clickGraphNode(): Promise<void> {
    this.logger.info('Selecting a graph node to reveal extension panel');

    // Wait for graph to render
    const graphContainer = this.page.locator('canvas, svg').first();
    await graphContainer.waitFor({ state: 'visible', timeout: 15000 });
    this.logger.debug('Graph container is visible');

    // Open search on graph
    const searchButton = this.page.getByRole('button', { name: 'Search on graph' });
    await searchButton.waitFor({ state: 'visible', timeout: 10000 });
    await searchButton.click();
    this.logger.debug('Clicked "Search on graph" button');

    // Wait for search box to appear
    const searchBox = this.page.getByRole('searchbox').first();
    await searchBox.waitFor({ state: 'visible', timeout: 5000 });

    // Search for common letter to get results
    await searchBox.fill('e');
    this.logger.debug('Entered search term: e');

    // Wait for search results to appear
    const resultButtons = this.page.locator('button').filter({ hasText: /Matches/i });
    await resultButtons.first().waitFor({ state: 'visible', timeout: 10000 });

    const resultCount = await resultButtons.count();
    if (resultCount === 0) {
      throw new Error('No search results found for graph node');
    }

    await resultButtons.first().click();
    this.logger.debug('Clicked first search result');

    // Wait for details panel to appear
    await this.page.waitForLoadState('networkidle');
    this.logger.success('Successfully selected a graph node');
  }

  async openFirstDetection(): Promise<void> {
    return this.withTiming(
      async () => {
        await this.page.waitForLoadState('networkidle');

        // In the new Endpoint Detections UI, detections are represented as buttons in the table
        // Look for process/host information buttons
        const firstDetectionButton = this.page.locator('[role="gridcell"] button').first();
        await firstDetectionButton.waitFor({ state: 'visible', timeout: 10000 });
        await firstDetectionButton.click();

        // Wait for detection details to load and socket extensions to initialize
        await this.page.waitForLoadState('networkidle');

        // Additional wait for socket extensions to load - they take time after detection opens
        await this.waiter.delay(2000);
        await this.page.waitForLoadState('networkidle');
      },
      'Open first detection'
    );
  }

  async verifyExtensionInSocket(extensionName: string): Promise<void> {
    return this.withTiming(
      async () => {
        // Look for extension as a button (expandable panel) or heading
        // Use .first() to handle multiple matching elements
        const extensionButton = this.page.getByRole('button', { name: new RegExp(extensionName, 'i') }).first();
        const extensionHeading = this.page.locator('h1, h2, h3, h4, [role="heading"]').filter({ hasText: new RegExp(extensionName, 'i') }).first();

        // Use navigation timeout for socket extensions as they take time to load after detection opens
        const timeout = config.navigationTimeout;

        // Try button first (workbench view), then heading (detection details view)
        const buttonVisible = await extensionButton.isVisible().catch(() => false);

        if (buttonVisible) {
          await extensionButton.scrollIntoViewIfNeeded({ timeout });
          await expect(extensionButton).toBeVisible({ timeout });
          this.logger.success(`Found extension "${extensionName}" as expandable button`);
        } else {
          await extensionHeading.scrollIntoViewIfNeeded({ timeout });
          await expect(extensionHeading).toBeVisible({ timeout });
          this.logger.success(`Found extension "${extensionName}" as heading`);
        }
      },
      `Verify extension "${extensionName}" in socket`
    );
  }

  async clickExtensionTab(extensionName: string): Promise<void> {
    return this.withTiming(
      async () => {
        const extension = this.page.getByRole('tab', { name: new RegExp(extensionName, 'i') });
        await extension.click({ force: true });
      },
      `Click extension tab "${extensionName}"`
    );
  }
}
