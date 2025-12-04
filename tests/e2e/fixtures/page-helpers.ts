import { type Locator, type Page } from '@playwright/test';

/**
 * Common page helpers for Fresco e2e tests
 */
export class PageHelpers {
  constructor(private page: Page) {}

  /**
   * Login as a user
   */
  async login(username: string, password: string) {
    await this.page.goto('/signin');
    await this.page.fill('[name="username"], [type="text"]', username);
    await this.page.fill('[name="password"], [type="password"]', password);
    await this.page.click(
      '[type="submit"], button:has-text("Login"), button:has-text("Sign in")',
    );
    await this.page.waitForURL((url) => !url.pathname.includes('/signin'));
  }

  /**
   * Logout current user
   */
  async logout() {
    const userMenu = this.page.locator(
      '[data-testid="user-menu"], [aria-label*="User"], [aria-label*="Account"]',
    );
    if (await userMenu.isVisible()) {
      await userMenu.click();
      const logoutButton = this.page.locator(
        'button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout")',
      );
      await logoutButton.click();
      await this.page.waitForURL('/signin');
    }
  }

  /**
   * Wait for toast message and return its text
   */
  async waitForToast(): Promise<string> {
    const toast = this.page
      .locator('.toast, [role="alert"], [data-testid="toast"]')
      .first();
    await toast.waitFor({ state: 'visible' });
    const text = await toast.textContent();
    return text ?? '';
  }

  /**
   * Dismiss all toasts
   */
  async dismissToasts() {
    const toasts = this.page.locator('.toast, [role="alert"]');
    const count = await toasts.count();
    for (let i = 0; i < count; i++) {
      const closeButton = toasts
        .nth(i)
        .locator('button[aria-label="Close"], button:has-text("×")');
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    }
  }

  /**
   * Open dropdown menu for a specific item
   */
  async openDropdownMenu(container: Locator) {
    const menuButton = container.locator(
      'button[aria-label*="menu"], button[aria-label*="options"], button:has-text("⋮"), button:has-text("⋯")',
    );
    await menuButton.click();
    // Wait for menu to be visible
    await this.page
      .locator('[role="menu"], [data-testid="dropdown-menu"]')
      .waitFor({ state: 'visible' });
  }

  /**
   * Select option from dropdown menu
   */
  async selectDropdownOption(optionText: string) {
    const option = this.page.locator(
      `[role="menuitem"]:has-text("${optionText}"), button:has-text("${optionText}")`,
    );
    await option.click();
  }

  /**
   * Confirm a dialog
   */
  async confirmDialog() {
    const confirmButton = this.page
      .locator(
        'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("OK")',
      )
      .last();
    await confirmButton.click();
  }

  /**
   * Cancel a dialog
   */
  async cancelDialog() {
    const cancelButton = this.page
      .locator('button:has-text("Cancel"), button:has-text("No")')
      .last();
    await cancelButton.click();
  }

  /**
   * Upload a file
   */
  async uploadFile(
    fileName: string,
    content: string,
    mimeType = 'application/json',
  ) {
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: fileName,
      mimeType,
      buffer: Buffer.from(content),
    });
  }

  /**
   * Wait for page load
   */
  async waitForLoad() {
    await this.page.waitForLoadState('load');
  }

  /**
   * Take a screenshot with a descriptive name
   */
  async screenshot(name: string) {
    await this.page.screenshot({
      path: `tests/e2e/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Check if element exists without waiting
   */
  async exists(selector: string): Promise<boolean> {
    return (await this.page.locator(selector).count()) > 0;
  }

  /**
   * Get table data as array of objects
   */
  async getTableData(
    tableSelector = 'table',
  ): Promise<Record<string, string>[]> {
    const table = this.page.locator(tableSelector);
    const headers = await table.locator('thead th').allTextContents();
    const rows = await table.locator('tbody tr').all();

    const data = [];
    for (const row of rows) {
      const cells = await row.locator('td').allTextContents();
      const rowData: Record<string, string> = {};
      headers.forEach((header, index) => {
        rowData[header] = cells[index] ?? '';
      });
      data.push(rowData);
    }

    return data;
  }

  /**
   * Fill a form with data
   */
  async fillForm(formData: Record<string, string | boolean | number>) {
    for (const [field, value] of Object.entries(formData)) {
      const input = this.page.locator(`[name="${field}"]`);
      const inputType = await input.getAttribute('type');

      if (inputType === 'checkbox') {
        if (value) {
          await input.check();
        } else {
          await input.uncheck();
        }
      } else if (inputType === 'radio') {
        await input.locator(`[value="${value}"]`).check();
      } else if (await input.evaluate((el) => el.tagName === 'SELECT')) {
        await input.selectOption(String(value));
      } else {
        await input.fill(String(value));
      }
    }
  }

  /**
   * Navigate using the main navigation
   */
  async navigateTo(
    section: 'protocols' | 'interviews' | 'participants' | 'settings',
  ) {
    const navLink = this.page.locator(
      `nav a[href="/${section}"], [data-testid="nav-${section}"]`,
    );
    await navLink.click();
    await this.page.waitForURL(`**/${section}`);
  }
}

/**
 * Create page helpers instance
 */
export function createPageHelpers(page: Page): PageHelpers {
  return new PageHelpers(page);
}
