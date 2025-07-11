import { type Page, type Locator, expect } from '@playwright/test';
import { BaseDashboardPage } from './BaseDashboardPage';

/**
 * Protocol Management Page Object
 *
 * Handles interactions with the protocols dashboard page including
 * protocol upload, deletion, bulk operations, and table management.
 */
export class ProtocolsPage extends BaseDashboardPage {
  // Protocol-specific selectors
  protected readonly protocolSelectors = {
    // Upload
    uploadButton: '[data-testid="upload-protocol-button"]',
    addProtocolButton: '[data-testid="add-protocol-button"]',
    uploadModal: '[data-testid="upload-protocol-modal"]',
    uploadFileInput: '[data-testid="upload-file-input"]',
    uploadProgress: '[data-testid="upload-progress"]',
    
    // Protocol table
    protocolsTable: '[data-testid="protocols-table"]',
    protocolRow: '[data-testid="protocol-row"]',
    protocolName: '[data-testid="protocol-name"]',
    protocolStatus: '[data-testid="protocol-status"]',
    protocolActions: '[data-testid="protocol-actions"]',
    
    // Actions
    deleteProtocolButton: '[data-testid="delete-protocol-button"]',
    editProtocolButton: '[data-testid="edit-protocol-button"]',
    duplicateProtocolButton: '[data-testid="duplicate-protocol-button"]',
    
    // Bulk operations
    bulkDeleteButton: '[data-testid="bulk-delete-button"]',
    bulkDeleteDialog: '[data-testid="bulk-delete-dialog"]',
    
    // Anonymous recruitment
    anonymousRecruitmentToggle: '[data-testid="anonymous-recruitment-toggle"]',
    anonymousRecruitmentWarning: '[data-testid="anonymous-recruitment-warning"]',
    
    // Delete confirmation
    deleteConfirmationDialog: '[data-testid="delete-confirmation-dialog"]',
    deleteConfirmationInput: '[data-testid="delete-confirmation-input"]',
    
    // Protocol details
    protocolCard: '[data-testid="protocol-card"]',
    protocolTitle: '[data-testid="protocol-title"]',
    protocolDescription: '[data-testid="protocol-description"]',
    protocolVersion: '[data-testid="protocol-version"]',
    protocolCreatedAt: '[data-testid="protocol-created-at"]',
    protocolUpdatedAt: '[data-testid="protocol-updated-at"]',
  };

  constructor(page: Page) {
    super(page, '/dashboard/protocols');
  }

  /**
   * Get the page path for navigation
   */
  getPagePath(): string {
    return '/dashboard/protocols';
  }

  /**
   * Upload a protocol file
   */
  async uploadProtocol(filePath: string): Promise<void> {
    // Try to find upload button or add protocol button
    const uploadButton = this.page.locator(this.protocolSelectors.uploadButton);
    const addProtocolButton = this.page.locator(this.protocolSelectors.addProtocolButton);
    
    if (await uploadButton.isVisible()) {
      await uploadButton.click();
    } else if (await addProtocolButton.isVisible()) {
      await addProtocolButton.click();
    } else {
      throw new Error('Could not find upload protocol button');
    }

    // Wait for upload modal or file input
    try {
      await this.waitForModal();
      
      // Look for file input in modal
      const fileInput = this.page.locator(this.protocolSelectors.uploadFileInput);
      if (await fileInput.isVisible()) {
        await fileInput.setInputFiles(filePath);
      } else {
        // Fallback to generic file input
        await this.uploadFile(filePath);
      }
    } catch {
      // Direct file input approach
      await this.uploadFile(filePath);
    }

    // Wait for upload to complete
    await this.waitForLoadingToComplete();
    
    // Wait for success message or modal to close
    try {
      await this.waitForSuccessMessage();
    } catch {
      // If no success message, wait for modal to close
      await this.waitForElementToBeHidden(this.selectors.modal);
    }
  }

  /**
   * Delete a single protocol with confirmation
   */
  async deleteProtocol(protocolName: string): Promise<void> {
    const protocolRow = await this.getProtocolRowByName(protocolName);
    
    if (!protocolRow) {
      throw new Error(`Protocol "${protocolName}" not found in table`);
    }

    // Open actions dropdown
    const actionsDropdown = protocolRow.locator(this.selectors.actionsDropdown);
    await actionsDropdown.click();

    // Wait for dropdown menu
    await this.waitForElement(this.selectors.dropdownMenu);

    // Click delete button
    const deleteButton = this.page.locator(this.protocolSelectors.deleteProtocolButton);
    await deleteButton.click();

    // Wait for confirmation dialog
    await this.waitForConfirmationDialog();

    // Handle confirmation dialog
    await this.handleConfirmationDialog(true);

    // Wait for success message
    await this.waitForSuccessMessage();
  }

  /**
   * Select multiple protocols using checkboxes
   */
  async selectProtocols(protocolNames: string[]): Promise<void> {
    for (const protocolName of protocolNames) {
      const protocolRow = await this.getProtocolRowByName(protocolName);
      
      if (!protocolRow) {
        throw new Error(`Protocol "${protocolName}" not found in table`);
      }

      // Select checkbox in the row
      const checkbox = protocolRow.locator(this.selectors.checkbox);
      await checkbox.check();
    }

    // Verify selections
    const selectedCount = await this.getSelectedRowCount();
    expect(selectedCount).toBe(protocolNames.length);
  }

  /**
   * Execute bulk delete operation
   */
  async performBulkDelete(): Promise<void> {
    const selectedCount = await this.getSelectedRowCount();
    
    if (selectedCount === 0) {
      throw new Error('No protocols selected for bulk delete');
    }

    // Click bulk delete button
    const bulkDeleteButton = this.page.locator(this.protocolSelectors.bulkDeleteButton);
    await bulkDeleteButton.click();

    // Wait for bulk delete dialog
    await this.waitForElement(this.protocolSelectors.bulkDeleteDialog);

    // Confirm bulk delete
    await this.handleConfirmationDialog(true);

    // Wait for success message
    await this.waitForSuccessMessage();
  }

  /**
   * Wait for a specific protocol to appear in the table
   */
  async waitForProtocolInTable(protocolName: string, timeout = 10000): Promise<void> {
    const protocolSelector = `${this.selectors.tableRow}:has-text("${protocolName}")`;
    await this.page.waitForSelector(protocolSelector, { 
      state: 'visible', 
      timeout 
    });
  }

  /**
   * Toggle anonymous recruitment for a protocol
   */
  async toggleAnonymousRecruitment(protocolName: string): Promise<void> {
    const protocolRow = await this.getProtocolRowByName(protocolName);
    
    if (!protocolRow) {
      throw new Error(`Protocol "${protocolName}" not found in table`);
    }

    // Find and click the anonymous recruitment toggle
    const toggle = protocolRow.locator(this.protocolSelectors.anonymousRecruitmentToggle);
    await toggle.click();

    // Wait for any warning messages or confirmations
    try {
      await this.waitForElement(this.protocolSelectors.anonymousRecruitmentWarning, 2000);
    } catch {
      // No warning appeared, that's fine
    }

    // Wait for changes to be saved
    await this.waitForLoadingToComplete();
  }

  /**
   * Get protocol data from table by name
   */
  async getProtocolFromTable(protocolName: string): Promise<{
    name: string;
    status: string;
    version?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null> {
    const protocolRow = await this.getProtocolRowByName(protocolName);
    
    if (!protocolRow) {
      return null;
    }

    // Extract protocol data from the row
    const name = await this.getTextContent(protocolRow.locator(this.protocolSelectors.protocolName));
    const status = await this.getTextContent(protocolRow.locator(this.protocolSelectors.protocolStatus));
    const version = await this.getTextContent(protocolRow.locator(this.protocolSelectors.protocolVersion));
    const createdAt = await this.getTextContent(protocolRow.locator(this.protocolSelectors.protocolCreatedAt));
    const updatedAt = await this.getTextContent(protocolRow.locator(this.protocolSelectors.protocolUpdatedAt));

    return {
      name,
      status,
      version: version || undefined,
      createdAt: createdAt || undefined,
      updatedAt: updatedAt || undefined,
    };
  }

  /**
   * Search for protocols using the table filter
   */
  async searchProtocols(searchTerm: string): Promise<void> {
    await this.filterTable(searchTerm);
  }

  /**
   * Get all protocol names from the current table view
   */
  async getAllProtocolNames(): Promise<string[]> {
    const rows = this.page.locator(this.selectors.tableRow);
    const count = await rows.count();
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const nameElement = row.locator(this.protocolSelectors.protocolName);
      const name = await this.getTextContent(nameElement);
      if (name) {
        names.push(name);
      }
    }

    return names;
  }

  /**
   * Check if protocol exists in table
   */
  async protocolExists(protocolName: string): Promise<boolean> {
    const protocolRow = await this.getProtocolRowByName(protocolName);
    return protocolRow !== null;
  }

  /**
   * Get protocol row by name
   */
  private async getProtocolRowByName(protocolName: string) {
    const rows = this.page.locator(this.selectors.tableRow);
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const nameElement = row.locator(this.protocolSelectors.protocolName);
      const name = await this.getTextContent(nameElement);
      
      if (name === protocolName) {
        return row;
      }
    }

    return null;
  }

  /**
   * Get text content from element, handling empty/null cases
   */
  private async getTextContent(locator: Locator): Promise<string> {
    try {
      const text = await locator.textContent();
      return text?.trim() ?? '';
    } catch {
      return '';
    }
  }

  /**
   * Wait for protocols table to be populated
   */
  async waitForProtocolsTable(): Promise<void> {
    await this.waitForElement(this.selectors.dataTable);
    await this.waitForLoadingToComplete();
  }

  /**
   * Verify protocols page is loaded
   */
  async verifyProtocolsPageLoaded(): Promise<void> {
    await this.verifyPageLoaded();
    await this.waitForProtocolsTable();
  }

  /**
   * Duplicate a protocol
   */
  async duplicateProtocol(protocolName: string): Promise<void> {
    const protocolRow = await this.getProtocolRowByName(protocolName);
    
    if (!protocolRow) {
      throw new Error(`Protocol "${protocolName}" not found in table`);
    }

    // Open actions dropdown
    const actionsDropdown = protocolRow.locator(this.selectors.actionsDropdown);
    await actionsDropdown.click();

    // Wait for dropdown menu
    await this.waitForElement(this.selectors.dropdownMenu);

    // Click duplicate button
    const duplicateButton = this.page.locator(this.protocolSelectors.duplicateProtocolButton);
    await duplicateButton.click();

    // Wait for operation to complete
    await this.waitForLoadingToComplete();
    
    // Wait for success message
    await this.waitForSuccessMessage();
  }

  /**
   * Edit a protocol
   */
  async editProtocol(protocolName: string): Promise<void> {
    const protocolRow = await this.getProtocolRowByName(protocolName);
    
    if (!protocolRow) {
      throw new Error(`Protocol "${protocolName}" not found in table`);
    }

    // Open actions dropdown
    const actionsDropdown = protocolRow.locator(this.selectors.actionsDropdown);
    await actionsDropdown.click();

    // Wait for dropdown menu
    await this.waitForElement(this.selectors.dropdownMenu);

    // Click edit button
    const editButton = this.page.locator(this.protocolSelectors.editProtocolButton);
    await editButton.click();

    // Wait for navigation to edit page
    await this.waitForLoadingToComplete();
  }
}