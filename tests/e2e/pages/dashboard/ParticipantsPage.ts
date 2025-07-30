import { type Page, type Locator, expect } from '@playwright/test';
import { BaseDashboardPage } from './BaseDashboardPage';

/**
 * Participant Management Page Object
 *
 * Handles interactions with the participants dashboard page including
 * participant creation, import, export, URL generation, and table management.
 */
export class ParticipantsPage extends BaseDashboardPage {
  // Participant-specific selectors
  protected readonly participantSelectors = {
    // Add participant
    addParticipantButton: '[data-testid="add-participant-button"]',
    addParticipantModal: '[data-testid="add-participant-modal"]',
    participantForm: '[data-testid="participant-form"]',
    
    // Form fields
    participantIdInput: '[data-testid="participant-id-input"]',
    participantNameInput: '[data-testid="participant-name-input"]',
    participantEmailInput: '[data-testid="participant-email-input"]',
    participantPhoneInput: '[data-testid="participant-phone-input"]',
    participantNotesInput: '[data-testid="participant-notes-input"]',
    
    // Import CSV
    importCsvButton: '[data-testid="import-csv-button"]',
    importCsvModal: '[data-testid="import-csv-modal"]',
    csvFileInput: '[data-testid="csv-file-input"]',
    csvPreview: '[data-testid="csv-preview"]',
    csvMappingTable: '[data-testid="csv-mapping-table"]',
    importProgressBar: '[data-testid="import-progress-bar"]',
    
    // Participant table
    participantsTable: '[data-testid="participants-table"]',
    participantRow: '[data-testid="participant-row"]',
    participantId: '[data-testid="participant-id"]',
    participantName: '[data-testid="participant-name"]',
    participantEmail: '[data-testid="participant-email"]',
    participantStatus: '[data-testid="participant-status"]',
    participantActions: '[data-testid="participant-actions"]',
    
    // Search and filter
    searchParticipants: '[data-testid="search-participants"]',
    filterDropdown: '[data-testid="filter-dropdown"]',
    statusFilter: '[data-testid="status-filter"]',
    
    // Bulk operations
    bulkDeleteButton: '[data-testid="bulk-delete-participants-button"]',
    bulkDeleteDialog: '[data-testid="bulk-delete-participants-dialog"]',
    
    // Export
    exportButton: '[data-testid="export-participants-button"]',
    exportModal: '[data-testid="export-participants-modal"]',
    exportFormatSelect: '[data-testid="export-format-select"]',
    exportProgressBar: '[data-testid="export-progress-bar"]',
    
    // URL generation
    generateUrlButton: '[data-testid="generate-participation-url-button"]',
    generateUrlModal: '[data-testid="generate-participation-url-modal"]',
    urlGenerationForm: '[data-testid="url-generation-form"]',
    generatedUrlsTable: '[data-testid="generated-urls-table"]',
    copyUrlButton: '[data-testid="copy-url-button"]',
    downloadUrlsButton: '[data-testid="download-urls-button"]',
    
    // Participant details
    participantCard: '[data-testid="participant-card"]',
    participantDetails: '[data-testid="participant-details"]',
    participantInterviews: '[data-testid="participant-interviews"]',
    
    // Actions
    editParticipantButton: '[data-testid="edit-participant-button"]',
    deleteParticipantButton: '[data-testid="delete-participant-button"]',
    viewParticipantButton: '[data-testid="view-participant-button"]',
    
    // Validation
    fieldError: '[data-testid="field-error"]',
    formValidationError: '[data-testid="form-validation-error"]',
  };

  constructor(page: Page) {
    super(page, '/dashboard/participants');
  }

  /**
   * Get the page path for navigation
   */
  getPagePath(): string {
    return '/dashboard/participants';
  }

  /**
   * Open the add participant modal
   */
  async openAddParticipantModal(): Promise<void> {
    const addButton = this.page.locator(this.participantSelectors.addParticipantButton);
    await addButton.click();
    
    // Wait for modal to open
    await this.waitForElement(this.participantSelectors.addParticipantModal);
  }

  /**
   * Fill participant form with provided data
   */
  async fillParticipantForm(data: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }): Promise<void> {
    // Fill form fields if provided
    if (data.id) {
      await this.fillFormField('participant-id', data.id);
    }
    
    if (data.name) {
      await this.fillFormField('participant-name', data.name);
    }
    
    if (data.email) {
      await this.fillFormField('participant-email', data.email);
    }
    
    if (data.phone) {
      await this.fillFormField('participant-phone', data.phone);
    }
    
    if (data.notes) {
      await this.fillFormField('participant-notes', data.notes);
    }
  }

  /**
   * Submit the participant form
   */
  async submitParticipantForm(): Promise<void> {
    await this.submitForm();
    
    // Wait for form submission to complete
    await this.waitForLoadingToComplete();
    
    // Wait for success message or modal to close
    try {
      await this.waitForSuccessMessage();
    } catch {
      // If no success message, wait for modal to close
      await this.waitForElementToBeHidden(this.participantSelectors.addParticipantModal);
    }
  }

  /**
   * Import participants from CSV file
   */
  async importParticipantsCSV(filePath: string): Promise<void> {
    // Click import CSV button
    const importButton = this.page.locator(this.participantSelectors.importCsvButton);
    await importButton.click();
    
    // Wait for import modal
    await this.waitForElement(this.participantSelectors.importCsvModal);
    
    // Upload CSV file
    const fileInput = this.page.locator(this.participantSelectors.csvFileInput);
    await fileInput.setInputFiles(filePath);
    
    // Wait for CSV preview to load
    await this.waitForElement(this.participantSelectors.csvPreview);
    
    // Submit import
    await this.submitForm();
    
    // Wait for import to complete
    await this.waitForLoadingToComplete();
    
    // Wait for success message
    await this.waitForSuccessMessage();
  }

  /**
   * Search participants by query
   */
  async searchParticipants(query: string): Promise<void> {
    const searchInput = this.page.locator(this.participantSelectors.searchParticipants);
    await searchInput.fill(query);
    await searchInput.press('Enter');
    
    // Wait for search results
    await this.waitForLoadingToComplete();
  }

  /**
   * Select multiple participants by IDs
   */
  async selectParticipants(participantIds: string[]): Promise<void> {
    for (const participantId of participantIds) {
      const participantRow = await this.getParticipantRowById(participantId);
      
      if (!participantRow) {
        throw new Error(`Participant with ID "${participantId}" not found in table`);
      }
      
      // Select checkbox in the row
      const checkbox = participantRow.locator(this.selectors.checkbox);
      await checkbox.check();
    }
    
    // Verify selections
    const selectedCount = await this.getSelectedRowCount();
    expect(selectedCount).toBe(participantIds.length);
  }

  /**
   * Delete selected participants
   */
  async deleteParticipants(): Promise<void> {
    const selectedCount = await this.getSelectedRowCount();
    
    if (selectedCount === 0) {
      throw new Error('No participants selected for deletion');
    }
    
    // Click bulk delete button
    const deleteButton = this.page.locator(this.participantSelectors.bulkDeleteButton);
    await deleteButton.click();
    
    // Wait for confirmation dialog
    await this.waitForElement(this.participantSelectors.bulkDeleteDialog);
    
    // Confirm deletion
    await this.handleConfirmationDialog(true);
    
    // Wait for deletion to complete
    await this.waitForLoadingToComplete();
    
    // Wait for success message
    await this.waitForSuccessMessage();
  }

  /**
   * Export participants to CSV
   */
  async exportParticipants(): Promise<void> {
    // Click export button
    const exportButton = this.page.locator(this.participantSelectors.exportButton);
    await exportButton.click();
    
    // Wait for export modal
    await this.waitForElement(this.participantSelectors.exportModal);
    
    // Select export format if available
    try {
      const formatSelect = this.page.locator(this.participantSelectors.exportFormatSelect);
      if (await formatSelect.isVisible()) {
        await formatSelect.selectOption('csv');
      }
    } catch {
      // Format selection not available
    }
    
    // Submit export
    await this.submitForm();
    
    // Wait for export to complete
    await this.waitForLoadingToComplete();
    
    // Wait for success message or download
    try {
      await this.waitForSuccessMessage();
    } catch {
      // Export might trigger download without success message
    }
  }

  /**
   * Generate participant URLs
   */
  async generateParticipantURLs(): Promise<void> {
    // Click generate URL button
    const generateButton = this.page.locator(this.participantSelectors.generateUrlButton);
    await generateButton.click();
    
    // Wait for URL generation modal
    await this.waitForElement(this.participantSelectors.generateUrlModal);
    
    // Submit URL generation form
    await this.submitForm();
    
    // Wait for URLs to be generated
    await this.waitForLoadingToComplete();
    
    // Wait for generated URLs table
    await this.waitForElement(this.participantSelectors.generatedUrlsTable);
  }

  /**
   * Get participant data from table by ID
   */
  async getParticipantFromTable(participantId: string): Promise<{
    id: string;
    name: string;
    email: string;
    status: string;
  } | null> {
    const participantRow = await this.getParticipantRowById(participantId);
    
    if (!participantRow) {
      return null;
    }
    
    // Extract participant data from the row
    const id = await this.getTextContent(participantRow.locator(this.participantSelectors.participantId));
    const name = await this.getTextContent(participantRow.locator(this.participantSelectors.participantName));
    const email = await this.getTextContent(participantRow.locator(this.participantSelectors.participantEmail));
    const status = await this.getTextContent(participantRow.locator(this.participantSelectors.participantStatus));
    
    return { id, name, email, status };
  }

  /**
   * Get all participant IDs from the current table view
   */
  async getAllParticipantIds(): Promise<string[]> {
    const rows = this.page.locator(this.selectors.tableRow);
    const count = await rows.count();
    const ids: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const idElement = row.locator(this.participantSelectors.participantId);
      const id = await this.getTextContent(idElement);
      if (id) {
        ids.push(id);
      }
    }
    
    return ids;
  }

  /**
   * Check if participant exists in table
   */
  async participantExists(participantId: string): Promise<boolean> {
    const participantRow = await this.getParticipantRowById(participantId);
    return participantRow !== null;
  }

  /**
   * Wait for participant to appear in table
   */
  async waitForParticipantInTable(participantId: string, timeout = 10000): Promise<void> {
    const participantSelector = `${this.selectors.tableRow}:has-text("${participantId}")`;
    await this.page.waitForSelector(participantSelector, { 
      state: 'visible', 
      timeout 
    });
  }

  /**
   * Edit a participant
   */
  async editParticipant(participantId: string): Promise<void> {
    const participantRow = await this.getParticipantRowById(participantId);
    
    if (!participantRow) {
      throw new Error(`Participant with ID "${participantId}" not found in table`);
    }
    
    // Open actions dropdown
    const actionsDropdown = participantRow.locator(this.selectors.actionsDropdown);
    await actionsDropdown.click();
    
    // Wait for dropdown menu
    await this.waitForElement(this.selectors.dropdownMenu);
    
    // Click edit button
    const editButton = this.page.locator(this.participantSelectors.editParticipantButton);
    await editButton.click();
    
    // Wait for edit modal or page
    await this.waitForLoadingToComplete();
  }

  /**
   * Delete a single participant
   */
  async deleteParticipant(participantId: string): Promise<void> {
    const participantRow = await this.getParticipantRowById(participantId);
    
    if (!participantRow) {
      throw new Error(`Participant with ID "${participantId}" not found in table`);
    }
    
    // Open actions dropdown
    const actionsDropdown = participantRow.locator(this.selectors.actionsDropdown);
    await actionsDropdown.click();
    
    // Wait for dropdown menu
    await this.waitForElement(this.selectors.dropdownMenu);
    
    // Click delete button
    const deleteButton = this.page.locator(this.participantSelectors.deleteParticipantButton);
    await deleteButton.click();
    
    // Wait for confirmation dialog
    await this.waitForConfirmationDialog();
    
    // Confirm deletion
    await this.handleConfirmationDialog(true);
    
    // Wait for success message
    await this.waitForSuccessMessage();
  }

  /**
   * Copy participant URL to clipboard
   */
  async copyParticipantUrl(participantId: string): Promise<void> {
    // First generate URLs if not already done
    await this.generateParticipantURLs();
    
    // Find the participant row in the URLs table
    const urlsTable = this.page.locator(this.participantSelectors.generatedUrlsTable);
    const participantUrlRow = urlsTable.locator(`tr:has-text("${participantId}")`);
    
    // Click copy URL button
    const copyButton = participantUrlRow.locator(this.participantSelectors.copyUrlButton);
    await copyButton.click();
    
    // Wait for copy success indication
    await this.waitForSuccessMessage();
  }

  /**
   * Download participant URLs
   */
  async downloadParticipantUrls(): Promise<void> {
    // Generate URLs first
    await this.generateParticipantURLs();
    
    // Click download URLs button
    const downloadButton = this.page.locator(this.participantSelectors.downloadUrlsButton);
    await downloadButton.click();
    
    // Wait for download to start
    await this.waitForLoadingToComplete();
  }

  /**
   * Filter participants by status
   */
  async filterParticipantsByStatus(status: string): Promise<void> {
    const filterDropdown = this.page.locator(this.participantSelectors.filterDropdown);
    await filterDropdown.click();
    
    const statusFilter = this.page.locator(this.participantSelectors.statusFilter);
    await statusFilter.selectOption(status);
    
    // Wait for filter to apply
    await this.waitForLoadingToComplete();
  }

  /**
   * Get participant row by ID
   */
  private async getParticipantRowById(participantId: string) {
    const rows = this.page.locator(this.selectors.tableRow);
    const count = await rows.count();
    
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const idElement = row.locator(this.participantSelectors.participantId);
      const id = await this.getTextContent(idElement);
      
      if (id === participantId) {
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
   * Wait for participants table to be populated
   */
  async waitForParticipantsTable(): Promise<void> {
    await this.waitForElement(this.participantSelectors.participantsTable);
    await this.waitForLoadingToComplete();
  }

  /**
   * Verify participants page is loaded
   */
  async verifyParticipantsPageLoaded(): Promise<void> {
    await this.verifyPageLoaded();
    await this.waitForParticipantsTable();
  }

  /**
   * Get participant count from table
   */
  async getParticipantCount(): Promise<number> {
    return await this.getTableRowCount();
  }

  /**
   * Check if participants table is empty
   */
  async isParticipantsTableEmpty(): Promise<boolean> {
    const count = await this.getParticipantCount();
    return count === 0;
  }

  /**
   * Validate form errors
   */
  async getFormValidationErrors(): Promise<string[]> {
    const errorElements = this.page.locator(this.participantSelectors.fieldError);
    const count = await errorElements.count();
    const errors: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const errorText = await errorElements.nth(i).textContent();
      if (errorText) {
        errors.push(errorText.trim());
      }
    }
    
    return errors;
  }
}