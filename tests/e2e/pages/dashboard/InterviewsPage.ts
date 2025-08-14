import { type Page, type Locator, expect } from '@playwright/test';
import { BaseDashboardPage } from './BaseDashboardPage';

/**
 * Page Object Model for the Interviews dashboard page
 * Provides methods for filtering, managing, and analyzing interviews
 */
export class InterviewsPage extends BaseDashboardPage {
  // Interview-specific selectors
  protected readonly interviewSelectors = {
    // Main table
    interviewsTable: '[data-testid="interviews-table"]',
    interviewRow: '[data-testid="interview-row"]',
    participantIdentifier: '[data-testid="participant-identifier"]',
    protocolName: '[data-testid="protocol-name"]',
    startTime: '[data-testid="start-time"]',
    lastUpdated: '[data-testid="last-updated"]',
    progress: '[data-testid="progress"]',
    progressBar: '[data-testid="progress-bar"]',
    progressValue: '[data-testid="progress-value"]',
    networkSummary: '[data-testid="network-summary"]',
    exportStatus: '[data-testid="export-status"]',
    exportBadge: '[data-testid="export-badge"]',
    
    // Filtering
    statusFilter: '[data-testid="status-filter"]',
    statusFilterSelect: '[data-testid="status-filter-select"]',
    dateRangeFilter: '[data-testid="date-range-filter"]',
    startDateInput: '[data-testid="start-date-input"]',
    endDateInput: '[data-testid="end-date-input"]',
    participantFilter: '[data-testid="participant-filter"]',
    participantFilterInput: '[data-testid="participant-filter-input"]',
    protocolFilter: '[data-testid="protocol-filter"]',
    protocolFilterSelect: '[data-testid="protocol-filter-select"]',
    clearFiltersButton: '[data-testid="clear-filters-button"]',
    applyFiltersButton: '[data-testid="apply-filters-button"]',
    
    // Bulk operations
    bulkDeleteButton: '[data-testid="bulk-delete-interviews-button"]',
    bulkDeleteDialog: '[data-testid="bulk-delete-interviews-dialog"]',
    bulkExportButton: '[data-testid="bulk-export-interviews-button"]',
    
    // Export functionality
    exportButton: '[data-testid="export-interviews-button"]',
    exportModal: '[data-testid="export-interviews-modal"]',
    exportFormatSelect: '[data-testid="export-format-select"]',
    exportJsonOption: '[data-testid="export-json-option"]',
    exportCsvOption: '[data-testid="export-csv-option"]',
    exportNetworkOnlyOption: '[data-testid="export-network-only-option"]',
    exportWithParticipantsOption: '[data-testid="export-with-participants-option"]',
    exportProgressBar: '[data-testid="export-progress-bar"]',
    downloadExportButton: '[data-testid="download-export-button"]',
    
    // Analytics/Statistics
    analyticsSection: '[data-testid="analytics-section"]',
    totalInterviewsCount: '[data-testid="total-interviews-count"]',
    completedInterviewsCount: '[data-testid="completed-interviews-count"]',
    inProgressInterviewsCount: '[data-testid="in-progress-interviews-count"]',
    completionRateDisplay: '[data-testid="completion-rate-display"]',
    averageProgressDisplay: '[data-testid="average-progress-display"]',
    exportedInterviewsCount: '[data-testid="exported-interviews-count"]',
    unexportedInterviewsCount: '[data-testid="unexported-interviews-count"]',
    
    // Interview actions
    viewInterviewButton: '[data-testid="view-interview-button"]',
    resumeInterviewButton: '[data-testid="resume-interview-button"]',
    deleteInterviewButton: '[data-testid="delete-interview-button"]',
    exportSingleInterviewButton: '[data-testid="export-single-interview-button"]',
    
    // URL generation
    generateUrlsButton: '[data-testid="generate-interview-urls-button"]',
    generateUrlsModal: '[data-testid="generate-interview-urls-modal"]',
    urlGenerationForm: '[data-testid="url-generation-form"]',
    generatedUrlsTable: '[data-testid="generated-urls-table"]',
    copyUrlButton: '[data-testid="copy-url-button"]',
    downloadUrlsButton: '[data-testid="download-urls-button"]',
    
    // Empty states
    emptyInterviewsState: '[data-testid="empty-interviews-state"]',
    noResultsState: '[data-testid="no-results-state"]',
  };

  constructor(page: Page) {
    super(page, '/dashboard/interviews');
  }

  /**
   * Get the page path for navigation
   */
  getPagePath(): string {
    return '/dashboard/interviews';
  }

  /**
   * Filter interviews by completion status
   */
  async filterByStatus(status: 'all' | 'completed' | 'in-progress' | 'not-started'): Promise<void> {
    const filterSelect = this.page.locator(this.interviewSelectors.statusFilterSelect);
    await filterSelect.selectOption(status);
    await this.waitForLoadingToComplete();
  }

  /**
   * Filter interviews by date range
   */
  async filterByDateRange(startDate: string, endDate: string): Promise<void> {
    // Open date range filter if not visible
    const dateRangeFilter = this.page.locator(this.interviewSelectors.dateRangeFilter);
    if (!(await dateRangeFilter.isVisible())) {
      const filterButton = this.page.locator(this.selectors.filterButton);
      await filterButton.click();
    }

    // Fill start and end dates
    await this.page.fill(this.interviewSelectors.startDateInput, startDate);
    await this.page.fill(this.interviewSelectors.endDateInput, endDate);
    
    // Apply filters
    const applyButton = this.page.locator(this.interviewSelectors.applyFiltersButton);
    if (await applyButton.isVisible()) {
      await applyButton.click();
    }
    
    await this.waitForLoadingToComplete();
  }

  /**
   * Filter interviews by participant
   */
  async filterByParticipant(participantName: string): Promise<void> {
    const participantInput = this.page.locator(this.interviewSelectors.participantFilterInput);
    await participantInput.fill(participantName);
    await participantInput.press('Enter');
    await this.waitForLoadingToComplete();
  }

  /**
   * Filter interviews by protocol
   */
  async filterByProtocol(protocolName: string): Promise<void> {
    const protocolSelect = this.page.locator(this.interviewSelectors.protocolFilterSelect);
    await protocolSelect.selectOption({ label: protocolName });
    await this.waitForLoadingToComplete();
  }

  /**
   * Clear all active filters
   */
  async clearFilters(): Promise<void> {
    const clearButton = this.page.locator(this.interviewSelectors.clearFiltersButton);
    await clearButton.click();
    await this.waitForLoadingToComplete();
  }

  /**
   * Select multiple interviews by participant identifiers
   */
  async selectInterviews(interviewIds: string[]): Promise<void> {
    for (const interviewId of interviewIds) {
      const interviewRow = await this.getInterviewRowByParticipant(interviewId);
      
      if (!interviewRow) {
        throw new Error(`Interview with participant ID "${interviewId}" not found in table`);
      }
      
      // Select checkbox in the row
      const checkbox = interviewRow.locator(this.selectors.checkbox);
      await checkbox.check();
    }
    
    // Verify selections
    const selectedCount = await this.getSelectedRowCount();
    expect(selectedCount).toBe(interviewIds.length);
  }

  /**
   * Delete selected interviews
   */
  async deleteInterviews(): Promise<void> {
    const selectedCount = await this.getSelectedRowCount();
    
    if (selectedCount === 0) {
      throw new Error('No interviews selected for deletion');
    }
    
    // Click bulk delete button
    const deleteButton = this.page.locator(this.interviewSelectors.bulkDeleteButton);
    await deleteButton.click();
    
    // Wait for confirmation dialog
    await this.waitForElement(this.interviewSelectors.bulkDeleteDialog);
    
    // Confirm deletion
    await this.handleConfirmationDialog(true);
    
    // Wait for deletion to complete
    await this.waitForLoadingToComplete();
    
    // Wait for success message
    await this.waitForSuccessMessage();
  }

  /**
   * Export interviews in specified format
   */
  async exportInterviews(format: 'json' | 'csv' | 'network-only' | 'with-participants'): Promise<void> {
    // Click export button
    const exportButton = this.page.locator(this.interviewSelectors.exportButton);
    await exportButton.click();
    
    // Wait for export modal
    await this.waitForElement(this.interviewSelectors.exportModal);
    
    // Select export format
    const formatOption = {
      'json': this.interviewSelectors.exportJsonOption,
      'csv': this.interviewSelectors.exportCsvOption,
      'network-only': this.interviewSelectors.exportNetworkOnlyOption,
      'with-participants': this.interviewSelectors.exportWithParticipantsOption,
    }[format];
    
    await this.page.click(formatOption);
    
    // Submit export
    await this.submitForm();
    
    // Wait for export to complete
    await this.waitForLoadingToComplete();
    
    // Wait for download button or success message
    try {
      await this.waitForElement(this.interviewSelectors.downloadExportButton, 15000);
    } catch {
      // If no download button, wait for success message
      await this.waitForSuccessMessage();
    }
  }

  /**
   * Get interview analytics and completion statistics
   */
  async getInterviewAnalytics(): Promise<{
    totalInterviews: number;
    completedInterviews: number;
    inProgressInterviews: number;
    completionRate: number;
    averageProgress: number;
    exportedInterviews: number;
    unexportedInterviews: number;
  }> {
    // Wait for analytics section to load
    await this.waitForElement(this.interviewSelectors.analyticsSection);
    
    // Extract statistics from the UI
    const totalInterviews = await this.getNumberFromElement(this.interviewSelectors.totalInterviewsCount);
    const completedInterviews = await this.getNumberFromElement(this.interviewSelectors.completedInterviewsCount);
    const inProgressInterviews = await this.getNumberFromElement(this.interviewSelectors.inProgressInterviewsCount);
    const exportedInterviews = await this.getNumberFromElement(this.interviewSelectors.exportedInterviewsCount);
    const unexportedInterviews = await this.getNumberFromElement(this.interviewSelectors.unexportedInterviewsCount);
    
    // Calculate completion rate and average progress from displayed values
    const completionRateText = await this.getTextContent(this.page.locator(this.interviewSelectors.completionRateDisplay));
    const completionRate = parseFloat(completionRateText.replace('%', '')) || 0;
    
    const averageProgressText = await this.getTextContent(this.page.locator(this.interviewSelectors.averageProgressDisplay));
    const averageProgress = parseFloat(averageProgressText.replace('%', '')) || 0;
    
    return {
      totalInterviews,
      completedInterviews,
      inProgressInterviews,
      completionRate,
      averageProgress,
      exportedInterviews,
      unexportedInterviews,
    };
  }

  /**
   * Get interview data from table by participant identifier
   */
  async getInterviewFromTable(participantIdentifier: string): Promise<{
    participantIdentifier: string;
    protocolName: string;
    startTime: string;
    lastUpdated: string;
    progress: number;
    exportStatus: string;
  } | null> {
    const interviewRow = await this.getInterviewRowByParticipant(participantIdentifier);
    
    if (!interviewRow) {
      return null;
    }
    
    // Extract interview data from the row
    const participantId = await this.getTextContent(interviewRow.locator(this.interviewSelectors.participantIdentifier));
    const protocolName = await this.getTextContent(interviewRow.locator(this.interviewSelectors.protocolName));
    const startTime = await this.getTextContent(interviewRow.locator(this.interviewSelectors.startTime));
    const lastUpdated = await this.getTextContent(interviewRow.locator(this.interviewSelectors.lastUpdated));
    const exportStatus = await this.getTextContent(interviewRow.locator(this.interviewSelectors.exportStatus));
    
    // Extract progress percentage
    const progressElement = interviewRow.locator(this.interviewSelectors.progressValue);
    const progressText = await this.getTextContent(progressElement);
    const progress = parseFloat(progressText.replace('%', '')) || 0;
    
    return {
      participantIdentifier: participantId,
      protocolName,
      startTime,
      lastUpdated,
      progress,
      exportStatus,
    };
  }

  /**
   * Get all participant identifiers from the current table view
   */
  async getAllInterviewParticipantIds(): Promise<string[]> {
    const rows = this.page.locator(this.selectors.tableRow);
    const count = await rows.count();
    const ids: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const idElement = row.locator(this.interviewSelectors.participantIdentifier);
      const id = await this.getTextContent(idElement);
      if (id) {
        ids.push(id);
      }
    }
    
    return ids;
  }

  /**
   * Check if interview exists in table by participant identifier
   */
  async interviewExists(participantIdentifier: string): Promise<boolean> {
    const interviewRow = await this.getInterviewRowByParticipant(participantIdentifier);
    return interviewRow !== null;
  }

  /**
   * Wait for interviews table to be populated
   */
  async waitForInterviewsTable(): Promise<void> {
    await this.waitForElement(this.interviewSelectors.interviewsTable);
    await this.waitForLoadingToComplete();
  }

  /**
   * Verify interviews page is loaded
   */
  async verifyInterviewsPageLoaded(): Promise<void> {
    await this.verifyPageLoaded();
    await this.waitForInterviewsTable();
  }

  /**
   * Get interview count from table
   */
  async getInterviewCount(): Promise<number> {
    return await this.getTableRowCount();
  }

  /**
   * Check if interviews table is empty
   */
  async isInterviewsTableEmpty(): Promise<boolean> {
    const count = await this.getInterviewCount();
    return count === 0;
  }

  /**
   * Filter interviews by completion status (using progress)
   */
  async filterByCompletionStatus(completed: boolean): Promise<void> {
    if (completed) {
      await this.filterByStatus('completed');
    } else {
      await this.filterByStatus('in-progress');
    }
  }

  /**
   * Generate interview URLs for incomplete interviews
   */
  async generateInterviewURLs(): Promise<void> {
    // Click generate URLs button
    const generateButton = this.page.locator(this.interviewSelectors.generateUrlsButton);
    await generateButton.click();
    
    // Wait for URL generation modal
    await this.waitForElement(this.interviewSelectors.generateUrlsModal);
    
    // Submit URL generation form
    await this.submitForm();
    
    // Wait for URLs to be generated
    await this.waitForLoadingToComplete();
    
    // Wait for generated URLs table
    await this.waitForElement(this.interviewSelectors.generatedUrlsTable);
  }

  /**
   * Get interview statistics for a specific protocol
   */
  async getProtocolStatistics(protocolName: string): Promise<{
    totalInterviews: number;
    completedInterviews: number;
    averageProgress: number;
  }> {
    // Filter by protocol first
    await this.filterByProtocol(protocolName);
    
    // Get the filtered results
    const allIds = await this.getAllInterviewParticipantIds();
    const totalInterviews = allIds.length;
    
    let completedCount = 0;
    let totalProgress = 0;
    
    // Check each interview's completion status
    for (const participantId of allIds) {
      const interview = await this.getInterviewFromTable(participantId);
      if (interview) {
        totalProgress += interview.progress;
        if (interview.progress >= 100) {
          completedCount++;
        }
      }
    }
    
    const averageProgress = totalInterviews > 0 ? totalProgress / totalInterviews : 0;
    
    // Clear filters to reset state
    await this.clearFilters();
    
    return {
      totalInterviews,
      completedInterviews: completedCount,
      averageProgress,
    };
  }

  /**
   * Get interview row by participant identifier
   */
  private async getInterviewRowByParticipant(participantIdentifier: string): Promise<Locator | null> {
    const rows = this.page.locator(this.selectors.tableRow);
    const count = await rows.count();
    
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const idElement = row.locator(this.interviewSelectors.participantIdentifier);
      const id = await this.getTextContent(idElement);
      
      if (id === participantIdentifier) {
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
   * Extract number from element text content
   */
  private async getNumberFromElement(selector: string): Promise<number> {
    try {
      const element = this.page.locator(selector);
      const text = await this.getTextContent(element);
      const number = parseInt(text.replace(/[^\d]/g, ''), 10);
      return isNaN(number) ? 0 : number;
    } catch {
      return 0;
    }
  }

  /**
   * Delete a single interview by participant identifier
   */
  async deleteSingleInterview(participantIdentifier: string): Promise<void> {
    const interviewRow = await this.getInterviewRowByParticipant(participantIdentifier);
    
    if (!interviewRow) {
      throw new Error(`Interview with participant ID "${participantIdentifier}" not found in table`);
    }
    
    // Open actions dropdown
    const actionsDropdown = interviewRow.locator(this.selectors.actionsDropdown);
    await actionsDropdown.click();
    
    // Wait for dropdown menu
    await this.waitForElement(this.selectors.dropdownMenu);
    
    // Click delete button
    const deleteButton = this.page.locator(this.interviewSelectors.deleteInterviewButton);
    await deleteButton.click();
    
    // Wait for confirmation dialog
    await this.waitForConfirmationDialog();
    
    // Confirm deletion
    await this.handleConfirmationDialog(true);
    
    // Wait for success message
    await this.waitForSuccessMessage();
  }

  /**
   * Export a single interview
   */
  async exportSingleInterview(participantIdentifier: string, format: 'json' | 'csv'): Promise<void> {
    const interviewRow = await this.getInterviewRowByParticipant(participantIdentifier);
    
    if (!interviewRow) {
      throw new Error(`Interview with participant ID "${participantIdentifier}" not found in table`);
    }
    
    // Open actions dropdown
    const actionsDropdown = interviewRow.locator(this.selectors.actionsDropdown);
    await actionsDropdown.click();
    
    // Wait for dropdown menu
    await this.waitForElement(this.selectors.dropdownMenu);
    
    // Click export button
    const exportButton = this.page.locator(this.interviewSelectors.exportSingleInterviewButton);
    await exportButton.click();
    
    // Wait for export modal
    await this.waitForElement(this.interviewSelectors.exportModal);
    
    // Select format
    const formatOption = format === 'json' 
      ? this.interviewSelectors.exportJsonOption 
      : this.interviewSelectors.exportCsvOption;
    
    await this.page.click(formatOption);
    
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
}