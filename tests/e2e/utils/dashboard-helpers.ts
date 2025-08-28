import { Page, Locator } from '@playwright/test';
import { TestHelpers } from './test-helpers';

export class DashboardHelpers extends TestHelpers {
  constructor(page: Page) {
    super(page);
  }

  // Navigation helpers
  async navigateToDashboard() {
    await this.page.goto('/dashboard');
    await this.waitForPageLoad();
  }

  async navigateToProtocols() {
    await this.page.goto('/dashboard/protocols');
    await this.waitForPageLoad();
  }

  async navigateToParticipants() {
    await this.page.goto('/dashboard/participants');
    await this.waitForPageLoad();
  }

  async navigateToInterviews() {
    await this.page.goto('/dashboard/interviews');
    await this.waitForPageLoad();
  }

  async navigateToSettings() {
    await this.page.goto('/dashboard/settings');
    await this.waitForPageLoad();
  }

  // Dashboard-specific UI helpers
  async waitForSummaryStats() {
    // Wait for the dashboard summary cards to load
    await this.page.waitForSelector('div:has-text("Protocols")');
  }

  async waitForActivityFeed() {
    // Wait for Recent Activity section
    await this.page.waitForSelector('h2:has-text("Recent Activity")');
  }

  async waitForProtocolsTable() {
    await this.waitForTableToLoad('[data-testid="protocols-table"] table');
  }

  async waitForParticipantsTable() {
    await this.waitForTableToLoad('[data-testid="participants-table"] table');
  }

  async waitForInterviewsTable() {
    await this.waitForTableToLoad('[data-testid="interviews-table"] table');
  }

  // Get common dashboard elements using data-testid attributes
  get summaryStats(): Locator {
    return this.page.locator('[data-testid="summary-statistics"]');
  }

  get activityFeed(): Locator {
    return this.page.locator('[data-testid="activity-feed"]');
  }

  get protocolsTable(): Locator {
    return this.page.locator('[data-testid="protocols-table"]');
  }

  get participantsTable(): Locator {
    return this.page.locator('[data-testid="participants-table"]');
  }

  get interviewsTable(): Locator {
    return this.page.locator('[data-testid="interviews-table"]');
  }

  get navigationBar(): Locator {
    return this.page.locator('[data-testid="navigation-bar"]');
  }

  // Hide dynamic content for consistent screenshots
  async hideDynamicContent() {
    const dynamicSelectors = [
      // Time-related elements
      'time', // All <time> elements
      '[data-testid="last-updated"]',
      '[data-testid="timestamp"]',
      '[data-testid="created-at"]',
      '[data-testid="updated-at"]',
      '[data-testid="activity-timestamp"]',
      '.relative-time',
      '.timestamp',
      '.ago', // timeago elements
      '[title*="ago"]',
      '[datetime]', // Elements with datetime attributes
      // Date/time text patterns
      '[class*="time"]',
      '[class*="date"]',
      '[id*="time"]',
      '[id*="date"]',
    ];
    
    await this.hideElements(dynamicSelectors);
  }

  // Alternative method: set static time content instead of hiding
  async setStaticTimeContent() {
    await this.page.evaluate(() => {
      // Set a fixed date for testing
      const staticTime = 'Jan 1, 2024';
      const staticDateTime = '2024-01-01T00:00:00Z';
      
      // Update all time elements
      const timeElements = document.querySelectorAll('time');
      timeElements.forEach(time => {
        time.textContent = staticTime;
        time.setAttribute('datetime', staticDateTime);
        time.setAttribute('title', staticTime);
      });
      
      // Update elements with common time-related data attributes
      const timeDataElements = document.querySelectorAll([
        '[data-testid*="timestamp"]',
        '[data-testid*="time"]', 
        '[data-testid*="date"]',
        '.timestamp',
        '.relative-time',
        '.ago'
      ].join(','));
      
      timeDataElements.forEach(element => {
        element.textContent = staticTime;
      });
    });
  }

  // Mask sensitive content
  async maskSensitiveContent() {
    const sensitiveSelectors = [
      '[data-testid="user-id"]',
      '[data-testid="session-id"]',
      '[data-testid="installation-id"]',
      '.user-id',
      '.session-id',
    ];
    
    await this.maskElements(sensitiveSelectors);
  }

  // Prepare page for visual regression testing
  async prepareForVisualTesting() {
    // Set static time content before hiding (in case we want to keep some visible)
    await this.setStaticTimeContent();
    await this.hideDynamicContent();
    await this.maskSensitiveContent();
    
    // Wait for any animations to complete
    await this.page.waitForTimeout(500);
  }
}