import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForElement(selector: string, timeout = 10000) {
    return await this.page.waitForSelector(selector, { timeout });
  }

  async scrollToElement(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  async takeFullPageScreenshot(name: string) {
    return await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  async takeElementScreenshot(selector: string, name: string) {
    const element = this.page.locator(selector);
    return await element.screenshot({
      path: `test-results/screenshots/${name}.png`,
    });
  }

  async expectVisualRegression(name: string, options?: { threshold?: number; maxDiffPixels?: number }) {
    await expect(this.page).toHaveScreenshot(`${name}.png`, {
      threshold: options?.threshold || 0.15,
      maxDiffPixels: options?.maxDiffPixels || 10000,
    });
  }

  async expectElementVisualRegression(
    selector: string, 
    name: string, 
    options?: { threshold?: number; maxDiffPixels?: number }
  ) {
    const element = this.page.locator(selector);
    await expect(element).toHaveScreenshot(`${name}.png`, {
      threshold: options?.threshold || 0.15,
      maxDiffPixels: options?.maxDiffPixels || 10000,
    });
  }

  async hideElements(selectors: string[]) {
    for (const selector of selectors) {
      await this.page.addStyleTag({
        content: `${selector} { visibility: hidden !important; }`,
      });
    }
  }

  async maskElements(selectors: string[]) {
    for (const selector of selectors) {
      await this.page.addStyleTag({
        content: `${selector} { background: #000 !important; color: transparent !important; }`,
      });
    }
  }

  async waitForTableToLoad(tableSelector = '[role="table"], table') {
    await this.page.waitForSelector(tableSelector);
    // Wait for any loading indicators to disappear
    await this.page.waitForFunction(
      (selector) => {
        const table = document.querySelector(selector);
        const loadingIndicators = table?.querySelectorAll('[data-testid*="loading"], .loading, .skeleton');
        return !loadingIndicators || loadingIndicators.length === 0;
      },
      tableSelector,
      { timeout: 10000 }
    );
  }
}

export const commonSelectors = {
  // Navigation
  nav: '[data-testid="navigation-bar"]',
  userMenu: '[data-testid="user-menu"]',
  logoutButton: '[data-testid="logout-button"]',
  
  // Common UI elements
  loadingSpinner: '[data-testid="loading-spinner"]',
  errorMessage: '[data-testid="error-message"]',
  successMessage: '[data-testid="success-message"]',
  
  // Tables
  table: '[role="table"]',
  tableRow: '[role="row"]',
  tableCell: '[role="cell"]',
  
  // Buttons
  primaryButton: '[data-testid="primary-button"]',
  secondaryButton: '[data-testid="secondary-button"]',
  deleteButton: '[data-testid="delete-button"]',
  
  // Forms
  submitButton: '[type="submit"]',
  cancelButton: '[data-testid="cancel-button"]',
  
  // Modals/Dialogs
  modal: '[role="dialog"]',
  modalOverlay: '[data-testid="modal-overlay"]',
  modalClose: '[data-testid="modal-close"]',
} as const;