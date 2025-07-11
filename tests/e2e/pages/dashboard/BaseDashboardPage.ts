import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Base Dashboard Page Object Class
 *
 * Provides common functionality for dashboard pages including navigation,
 * authentication handling, and common element interactions.
 */
export abstract class BaseDashboardPage {
  protected page: Page;
  protected baseUrl: string;

  // Common dashboard selectors
  protected readonly selectors = {
    // Navigation
    navigation: '[data-testid="navigation-bar"]',
    logo: '[data-testid="logo"]',
    userMenu: '[data-testid="user-menu"]',
    logoutButton: '[data-testid="logout-button"]',

    // Main navigation links
    navOverview: '[data-testid="nav-overview"]',
    navParticipants: '[data-testid="nav-participants"]',
    navProtocols: '[data-testid="nav-protocols"]',
    navInterviews: '[data-testid="nav-interviews"]',
    navSettings: '[data-testid="nav-settings"]',

    // Common elements
    loadingSpinner: '[data-testid="loading-spinner"]',
    errorMessage: '[data-testid="error-message"]',
    successMessage: '[data-testid="success-message"]',
    pageTitle: '[data-testid="page-title"]',
    pageDescription: '[data-testid="page-description"]',

    // Common buttons
    addButton: '[data-testid="add-button"]',
    deleteButton: '[data-testid="delete-button"]',
    editButton: '[data-testid="edit-button"]',
    saveButton: '[data-testid="save-button"]',
    cancelButton: '[data-testid="cancel-button"]',

    // Modal elements
    modal: '[data-testid="modal"]',
    modalTitle: '[data-testid="modal-title"]',
    modalContent: '[data-testid="modal-content"]',
    modalCloseButton: '[data-testid="modal-close"]',

    // Form elements
    form: '[data-testid="form"]',
    formError: '[data-testid="form-error"]',
    submitButton: '[type="submit"]',

    // Data table elements
    dataTable: '[data-testid="data-table"]',
    tableRow: '[data-testid="table-row"]',
    tableHeader: '[data-testid="table-header"]',
    tableCell: '[data-testid="table-cell"]',
    searchInput: '[data-testid="search-input"]',
    filterButton: '[data-testid="filter-button"]',
    sortButton: '[data-testid="sort-button"]',
    tableFilter: '[data-testid="table-filter"]',
    checkbox: '[data-testid="checkbox"]',
    selectAll: '[data-testid="select-all"]',
    bulkActions: '[data-testid="bulk-actions"]',
    actionsDropdown: '[data-testid="actions-dropdown"]',
    dropdownMenu: '[data-testid="dropdown-menu"]',
    emptyState: '[data-testid="empty-state"]',

    // Pagination
    pagination: '[data-testid="pagination"]',
    paginationNext: '[data-testid="pagination-next"]',
    paginationPrevious: '[data-testid="pagination-previous"]',
    paginationInfo: '[data-testid="pagination-info"]',

    // File input
    fileInput: 'input[type="file"]',

    // Confirmation dialogs
    confirmationDialog: '[data-testid="confirmation-dialog"]',
    confirmButton: '[data-testid="confirm-button"]',
    cancelDialogButton: '[data-testid="cancel-dialog-button"]',
  };

  constructor(page: Page, baseUrl = '/dashboard') {
    this.page = page;
    this.baseUrl = baseUrl;
  }

  // Abstract method to be implemented by specific page classes
  abstract getPagePath(): string;

  /**
   * Navigate to the specific dashboard page
   */
  async goto(): Promise<void> {
    await this.page.goto(this.getPagePath());
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    // Wait for navigation to be visible
    await this.page.waitForSelector(this.selectors.navigation, {
      state: 'visible',
    });

    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle');

    // Wait for any loading spinners to disappear
    await this.waitForLoadingToComplete();
  }

  /**
   * Wait for loading spinners to disappear
   */
  async waitForLoadingToComplete(): Promise<void> {
    try {
      // Wait for loading spinner to disappear if present
      await this.page.waitForSelector(this.selectors.loadingSpinner, {
        state: 'hidden',
        timeout: 10000,
      });
    } catch {
      // Ignore if loading spinner doesn't exist
    }
  }

  /**
   * Check if user is authenticated (on dashboard page)
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Check if we're on a dashboard page and navigation is visible
      const currentUrl = this.page.url();
      const isOnDashboard = currentUrl.includes('/dashboard');
      const navigationVisible = await this.page.isVisible(
        this.selectors.navigation,
      );

      return isOnDashboard && navigationVisible;
    } catch {
      return false;
    }
  }

  /**
   * Navigate to login page if not authenticated
   */
  async ensureAuthenticated(): Promise<void> {
    if (!(await this.isAuthenticated())) {
      await this.page.goto('/signin');
    }
  }

  /**
   * Navigate to different dashboard sections
   */
  async navigateToOverview(): Promise<void> {
    await this.page.click(this.selectors.navOverview);
    await this.page.waitForURL('/dashboard');
  }

  async navigateToParticipants(): Promise<void> {
    await this.page.click(this.selectors.navParticipants);
    await this.page.waitForURL('/dashboard/participants');
  }

  async navigateToProtocols(): Promise<void> {
    await this.page.click(this.selectors.navProtocols);
    await this.page.waitForURL('/dashboard/protocols');
  }

  async navigateToInterviews(): Promise<void> {
    await this.page.click(this.selectors.navInterviews);
    await this.page.waitForURL('/dashboard/interviews');
  }

  async navigateToSettings(): Promise<void> {
    await this.page.click(this.selectors.navSettings);
    await this.page.waitForURL('/dashboard/settings');
  }

  /**
   * Logout from the application
   */
  async logout(): Promise<void> {
    await this.page.click(this.selectors.userMenu);
    await this.page.click(this.selectors.logoutButton);
    await this.page.waitForURL('/signin');
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    const titleElement = this.page.locator(this.selectors.pageTitle);
    return (await titleElement.textContent()) ?? '';
  }

  /**
   * Get page description
   */
  async getPageDescription(): Promise<string> {
    const descriptionElement = this.page.locator(
      this.selectors.pageDescription,
    );
    return (await descriptionElement.textContent()) ?? '';
  }

  /**
   * Wait for and verify success message
   */
  async waitForSuccessMessage(expectedMessage?: string): Promise<void> {
    await this.page.waitForSelector(this.selectors.successMessage, {
      state: 'visible',
    });

    if (expectedMessage) {
      await expect(
        this.page.locator(this.selectors.successMessage),
      ).toContainText(expectedMessage);
    }
  }

  /**
   * Wait for and verify error message
   */
  async waitForErrorMessage(expectedMessage?: string): Promise<void> {
    await this.page.waitForSelector(this.selectors.errorMessage, {
      state: 'visible',
    });

    if (expectedMessage) {
      await expect(
        this.page.locator(this.selectors.errorMessage),
      ).toContainText(expectedMessage);
    }
  }

  /**
   * Check if modal is open
   */
  async isModalOpen(): Promise<boolean> {
    return await this.page.isVisible(this.selectors.modal);
  }

  /**
   * Wait for modal to open
   */
  async waitForModal(): Promise<void> {
    await this.page.waitForSelector(this.selectors.modal, { state: 'visible' });
  }

  /**
   * Close modal
   */
  async closeModal(): Promise<void> {
    await this.page.click(this.selectors.modalCloseButton);
    await this.page.waitForSelector(this.selectors.modal, { state: 'hidden' });
  }

  /**
   * Fill form field by label or placeholder
   */
  async fillFormField(fieldName: string, value: string): Promise<void> {
    // Try different strategies to find the form field
    const strategies = [
      `[name="${fieldName}"]`,
      `[placeholder="${fieldName}"]`,
      `[data-testid="${fieldName}"]`,
      `[data-testid="${fieldName}-input"]`,
      `label:has-text("${fieldName}") + input`,
      `label:has-text("${fieldName}") + textarea`,
    ];

    for (const selector of strategies) {
      try {
        const element = this.page.locator(selector);
        if (await element.isVisible()) {
          await element.fill(value);
          return;
        }
      } catch {
        // Try next strategy
      }
    }

    throw new Error(`Could not find form field with name: ${fieldName}`);
  }

  /**
   * Submit form
   */
  async submitForm(): Promise<void> {
    await this.page.click(this.selectors.submitButton);
  }

  /**
   * Search in data table
   */
  async searchInTable(searchTerm: string): Promise<void> {
    await this.page.fill(this.selectors.searchInput, searchTerm);
    await this.page.press(this.selectors.searchInput, 'Enter');
    await this.waitForLoadingToComplete();
  }

  /**
   * Filter data table
   */
  async filterTable(filterTerm: string): Promise<void> {
    await this.page.fill(this.selectors.tableFilter, filterTerm);
    await this.page.waitForTimeout(500); // Wait for debounce
    await this.waitForLoadingToComplete();
  }

  /**
   * Get table row count
   */
  async getTableRowCount(): Promise<number> {
    const rows = this.page.locator(this.selectors.tableRow);
    return await rows.count();
  }

  /**
   * Get table cell text
   */
  async getTableCellText(rowIndex: number, cellIndex: number): Promise<string> {
    const cell = this.page
      .locator(this.selectors.tableRow)
      .nth(rowIndex)
      .locator(this.selectors.tableCell)
      .nth(cellIndex);
    return (await cell.textContent()) ?? '';
  }

  /**
   * Click table row
   */
  async clickTableRow(rowIndex: number): Promise<void> {
    await this.page.locator(this.selectors.tableRow).nth(rowIndex).click();
  }

  /**
   * Select/deselect checkbox in table row
   */
  async selectTableRow(rowIndex: number, select = true): Promise<void> {
    const row = this.page.locator(this.selectors.tableRow).nth(rowIndex);
    const checkbox = row.locator(this.selectors.checkbox);
    
    const isChecked = await checkbox.isChecked();
    if (select && !isChecked) {
      await checkbox.check();
    } else if (!select && isChecked) {
      await checkbox.uncheck();
    }
  }

  /**
   * Select all rows in table
   */
  async selectAllTableRows(): Promise<void> {
    const selectAllCheckbox = this.page.locator(this.selectors.selectAll);
    await selectAllCheckbox.check();
  }

  /**
   * Deselect all rows in table
   */
  async deselectAllTableRows(): Promise<void> {
    const selectAllCheckbox = this.page.locator(this.selectors.selectAll);
    await selectAllCheckbox.uncheck();
  }

  /**
   * Get selected row count
   */
  async getSelectedRowCount(): Promise<number> {
    const checkedBoxes = this.page.locator(
      `${this.selectors.tableRow} ${this.selectors.checkbox}:checked`,
    );
    return await checkedBoxes.count();
  }

  /**
   * Upload file using file input
   */
  async uploadFile(filePath: string): Promise<void> {
    const fileInput = this.page.locator(this.selectors.fileInput);
    await fileInput.setInputFiles(filePath);
  }

  /**
   * Handle confirmation dialog
   */
  async handleConfirmationDialog(accept = true): Promise<void> {
    if (accept) {
      await this.page.click(this.selectors.confirmButton);
    } else {
      await this.page.click(this.selectors.cancelDialogButton);
    }
    await this.waitForLoadingToComplete();
  }

  /**
   * Wait for confirmation dialog to appear
   */
  async waitForConfirmationDialog(): Promise<void> {
    await this.page.waitForSelector(this.selectors.confirmationDialog, {
      state: 'visible',
    });
  }

  /**
   * Wait for specific element to be visible
   */
  async waitForElement(
    selector: string,
    timeout = 10000,
  ): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Wait for specific element to be hidden
   */
  async waitForElementToBeHidden(
    selector: string,
    timeout = 10000,
  ): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'hidden', timeout });
  }

  /**
   * Click element with retry logic
   */
  async clickWithRetry(
    selector: string,
    maxRetries = 3,
  ): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.page.click(selector);
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Wait for URL to match pattern
   */
  async waitForUrlPattern(pattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(pattern);
  }

  /**
   * Take screenshot of the page
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Take screenshot of specific element
   */
  async takeElementScreenshot(selector: string, name: string): Promise<void> {
    await this.page
      .locator(selector)
      .screenshot({ path: `screenshots/${name}.png` });
  }

  /**
   * Get locator for element
   */
  getLocator(selector: string): Locator {
    return this.page.locator(selector);
  }

  /**
   * Get page instance
   */
  getPage(): Page {
    return this.page;
  }

  /**
   * Verify page is loaded correctly
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.page.locator(this.selectors.navigation)).toBeVisible();
    await expect(this.page.locator(this.selectors.pageTitle)).toBeVisible();
  }

  /**
   * Handle confirmation dialog with page events
   */
  handleConfirmationDialogEvent(accept = true): void {
    this.page.once('dialog', (dialog) => {
      if (accept) {
        void dialog.accept();
      } else {
        void dialog.dismiss();
      }
    });
  }

  /**
   * Refresh page and wait for load
   */
  async refreshPage(): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();
  }

  /**
   * Go back in browser history
   */
  async goBack(): Promise<void> {
    await this.page.goBack();
    await this.waitForPageLoad();
  }

  /**
   * Go forward in browser history
   */
  async goForward(): Promise<void> {
    await this.page.goForward();
    await this.waitForPageLoad();
  }
}
