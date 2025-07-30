import { type Page, expect } from '@playwright/test';
import { BaseDashboardPage } from './BaseDashboardPage';

/**
 * Settings Page Object Class
 *
 * Provides functionality for interacting with the dashboard settings page
 * including installation ID management, UploadThing token configuration,
 * system settings, and environment information display.
 */
export class SettingsPage extends BaseDashboardPage {
  // Settings-specific selectors
  private readonly settingsSelectors = {
    // Page elements
    pageHeader: '[data-testid="page-title"]',
    pageDescription: '[data-testid="page-description"]',

    // Installation ID section
    installationIdSection: 'text=Installation ID',
    installationIdInput:
      '[name="installationId"], [data-testid="installation-id-input"]',
    installationIdError: '[data-testid="installation-id-error"]',
    installationIdReadOnlyAlert: '[data-testid="readonly-env-alert"]',

    // UploadThing token section
    uploadThingSection: 'text=UploadThing API Key',
    uploadThingInput:
      '[name="uploadThingToken"], [data-testid="uploadthing-token-input"]',
    uploadThingError: '[data-testid="uploadthing-token-error"]',
    uploadThingAlert: '[data-testid="uploadthing-alert"]',

    // Form controls
    saveButton: 'button:has-text("Save")',
    resetButton: 'button:has-text("Reset")',
    savingButton: 'button:has-text("Saving...")',

    // Version and environment section
    versionSection: 'text=App Version',
    versionInfo: '[data-testid="version-info"]',
    currentVersion: 'text=/You are currently running Fresco/',
    updateAlert: '[data-testid="update-alert"]',
    upgradeButton: 'button:has-text("View Full Release Notes")',

    // Settings switches
    anonymousRecruitmentSwitch: '[data-testid="anonymous-recruitment-switch"]',
    limitInterviewsSwitch: '[data-testid="limit-interviews-switch"]',
    disableAnalyticsSwitch: '[data-testid="disable-analytics-switch"]',

    // Reset settings section (dev only)
    resetSettingsSection: 'text=Reset Settings',
    resetSettingsButton: '[data-testid="reset-button"]',
    resetConfirmDialog: '[data-testid="confirmation-dialog"]',

    // Analytics test section (dev only)
    analyticsTestSection: 'text=Send Test Analytics Event',
    analyticsTestButton: '[data-testid="analytics-button"]',

    // General form elements
    inputField: 'input[type="text"]',
    inputError: '.error, [data-testid*="error"]',
    successMessage: '[data-testid="success-message"]',
    readOnlyAlert: '[data-testid="readonly-env-alert"]',

    // Setting sections
    settingsSection: '[data-testid="settings-section"]',
  };

  constructor(page: Page) {
    super(page, '/dashboard');
  }

  getPagePath(): string {
    return '/dashboard/settings';
  }

  /**
   * Verify the settings page is loaded correctly
   */
  async verifySettingsPageLoaded(): Promise<void> {
    await this.waitForPageLoad();
    await expect(
      this.page.locator(this.settingsSelectors.pageHeader),
    ).toBeVisible();
    await expect(this.page.locator('text=Settings')).toBeVisible();
    await expect(
      this.page.locator(this.settingsSelectors.installationIdSection),
    ).toBeVisible();
    await expect(
      this.page.locator(this.settingsSelectors.uploadThingSection),
    ).toBeVisible();
  }

  /**
   * Update the installation ID
   */
  async updateInstallationId(newId: string): Promise<void> {
    const input = this.page
      .locator(this.settingsSelectors.installationIdInput)
      .first();
    await input.fill(newId);

    // Wait for save button to appear
    await this.page.waitForSelector(this.settingsSelectors.saveButton, {
      state: 'visible',
    });
    await this.page.click(this.settingsSelectors.saveButton);

    // Wait for save to complete
    await this.waitForElementToBeHidden(
      this.settingsSelectors.savingButton,
      10000,
    );
    await this.waitForLoadingToComplete();
  }

  /**
   * Update the UploadThing token
   */
  async updateUploadThingToken(token: string): Promise<void> {
    const input = this.page
      .locator(this.settingsSelectors.uploadThingInput)
      .first();
    await input.fill(token);

    // Wait for save button to appear
    await this.page.waitForSelector(this.settingsSelectors.saveButton, {
      state: 'visible',
    });
    await this.page.click(this.settingsSelectors.saveButton);

    // Wait for save to complete
    await this.waitForElementToBeHidden(
      this.settingsSelectors.savingButton,
      10000,
    );
    await this.waitForLoadingToComplete();
  }

  /**
   * Verify settings persistence by refreshing page and checking values
   */
  async verifySettingsPersistence(): Promise<{
    installationId: string;
    uploadThingToken: string;
  }> {
    // Get current values
    const installationId = await this.getInstallationIdValue();
    const uploadThingToken = await this.getUploadThingTokenValue();

    // Refresh page
    await this.refreshPage();
    await this.verifySettingsPageLoaded();

    // Verify values are still the same
    const newInstallationId = await this.getInstallationIdValue();
    const newUploadThingToken = await this.getUploadThingTokenValue();

    expect(newInstallationId).toBe(installationId);
    expect(newUploadThingToken).toBe(uploadThingToken);

    return { installationId, uploadThingToken };
  }

  /**
   * Check environment and version information display
   */
  async checkEnvironmentDisplay(): Promise<{
    hasVersionInfo: boolean;
    versionText: string;
    hasUpdateInfo: boolean;
  }> {
    const versionSection = this.page.locator(
      this.settingsSelectors.versionSection,
    );
    const hasVersionInfo = await versionSection.isVisible();

    let versionText = '';
    if (hasVersionInfo) {
      const versionElement = this.page.locator(
        this.settingsSelectors.currentVersion,
      );
      versionText = (await versionElement.textContent()) ?? '';
    }

    const updateAlert = this.page.locator(this.settingsSelectors.updateAlert);
    const hasUpdateInfo = await updateAlert.isVisible().catch(() => false);

    return { hasVersionInfo, versionText, hasUpdateInfo };
  }

  /**
   * Validate installation ID input
   */
  async validateInstallationId(
    id: string,
  ): Promise<{ isValid: boolean; errorMessage?: string }> {
    const input = this.page
      .locator(this.settingsSelectors.installationIdInput)
      .first();
    await input.fill(id);

    // Wait for validation
    await this.page.waitForTimeout(500);

    const errorElement = this.page
      .locator(this.settingsSelectors.inputError)
      .first();
    const hasError = await errorElement.isVisible().catch(() => false);

    if (hasError) {
      const errorMessage = await errorElement.textContent();
      return { isValid: false, errorMessage: errorMessage ?? undefined };
    }

    return { isValid: true };
  }

  /**
   * Validate UploadThing token input
   */
  async validateUploadThingToken(
    token: string,
  ): Promise<{ isValid: boolean; errorMessage?: string }> {
    const input = this.page
      .locator(this.settingsSelectors.uploadThingInput)
      .first();
    await input.fill(token);

    // Wait for validation
    await this.page.waitForTimeout(500);

    const errorElement = this.page
      .locator(this.settingsSelectors.inputError)
      .first();
    const hasError = await errorElement.isVisible().catch(() => false);

    if (hasError) {
      const errorMessage = await errorElement.textContent();
      return { isValid: false, errorMessage: errorMessage ?? undefined };
    }

    return { isValid: true };
  }

  /**
   * Get system information including version and environment
   */
  async getSystemInformation(): Promise<{
    version?: string;
    environment?: string;
    hasUpdateAvailable: boolean;
    updateInfo?: string;
  }> {
    const envDisplay = await this.checkEnvironmentDisplay();

    const versionMatch = /Fresco\s+([^\s]+)/.exec(envDisplay.versionText);
    const version = versionMatch?.[1];
    const environment = 'development'; // Default for test environment

    let updateInfo: string | undefined;
    if (envDisplay.hasUpdateInfo) {
      const updateElement = this.page.locator(
        this.settingsSelectors.updateAlert,
      );
      updateInfo = (await updateElement.textContent()) ?? undefined;
    }

    return {
      version,
      environment,
      hasUpdateAvailable: envDisplay.hasUpdateInfo,
      updateInfo,
    };
  }

  /**
   * Reset settings to defaults (if reset functionality is available)
   */
  async resetToDefaults(): Promise<void> {
    const resetSection = this.page.locator(
      this.settingsSelectors.resetSettingsSection,
    );
    const isResetAvailable = await resetSection.isVisible().catch(() => false);

    if (!isResetAvailable) {
      throw new Error(
        'Reset functionality is not available in this environment',
      );
    }

    // Click reset button
    await this.page.click(this.settingsSelectors.resetSettingsButton);

    // Handle confirmation dialog
    await this.waitForConfirmationDialog();
    await this.handleConfirmationDialog(true);

    // Wait for reset to complete
    await this.waitForLoadingToComplete();
  }

  /**
   * Get current installation ID value
   */
  async getInstallationIdValue(): Promise<string> {
    const input = this.page
      .locator(this.settingsSelectors.installationIdInput)
      .first();
    return await input.inputValue();
  }

  /**
   * Get current UploadThing token value
   */
  async getUploadThingTokenValue(): Promise<string> {
    const input = this.page
      .locator(this.settingsSelectors.uploadThingInput)
      .first();
    return await input.inputValue();
  }

  /**
   * Check if installation ID is read-only
   */
  async isInstallationIdReadOnly(): Promise<boolean> {
    const input = this.page
      .locator(this.settingsSelectors.installationIdInput)
      .first();
    const isDisabled = await input.isDisabled();

    const readOnlyAlert = this.page.locator(
      this.settingsSelectors.installationIdReadOnlyAlert,
    );
    const hasReadOnlyAlert = await readOnlyAlert.isVisible().catch(() => false);

    return isDisabled || hasReadOnlyAlert;
  }

  /**
   * Check if UploadThing token section has alerts
   */
  async hasUploadThingAlerts(): Promise<{
    hasAlert: boolean;
    alertText?: string;
  }> {
    const alert = this.page.locator(this.settingsSelectors.uploadThingAlert);
    const hasAlert = await alert.isVisible().catch(() => false);

    if (hasAlert) {
      const alertText = await alert.textContent();
      return { hasAlert: true, alertText: alertText ?? undefined };
    }

    return { hasAlert: false };
  }

  /**
   * Toggle anonymous recruitment setting
   */
  async toggleAnonymousRecruitment(): Promise<void> {
    const toggle = this.page.locator(
      this.settingsSelectors.anonymousRecruitmentSwitch,
    );
    await toggle.click();
    await this.waitForLoadingToComplete();
  }

  /**
   * Toggle limit interviews setting
   */
  async toggleLimitInterviews(): Promise<void> {
    const toggle = this.page.locator(
      this.settingsSelectors.limitInterviewsSwitch,
    );
    await toggle.click();
    await this.waitForLoadingToComplete();
  }

  /**
   * Toggle disable analytics setting
   */
  async toggleDisableAnalytics(): Promise<void> {
    const toggle = this.page.locator(
      this.settingsSelectors.disableAnalyticsSwitch,
    );
    await toggle.click();
    await this.waitForLoadingToComplete();
  }

  /**
   * Get form validation errors
   */
  async getFormValidationErrors(): Promise<string[]> {
    const errorElements = this.page.locator(this.settingsSelectors.inputError);
    const errorCount = await errorElements.count();
    const errors: string[] = [];

    for (let i = 0; i < errorCount; i++) {
      const errorText = await errorElements.nth(i).textContent();
      if (errorText) {
        errors.push(errorText);
      }
    }

    return errors;
  }

  /**
   * Check if save button is enabled
   */
  async isSaveButtonEnabled(): Promise<boolean> {
    const saveButton = this.page.locator(this.settingsSelectors.saveButton);
    const isVisible = await saveButton.isVisible().catch(() => false);
    if (!isVisible) return false;

    const isDisabled = await saveButton.isDisabled();
    return !isDisabled;
  }

  /**
   * Wait for save operation to complete
   */
  async waitForSaveToComplete(): Promise<void> {
    // Wait for saving button to appear and disappear
    try {
      await this.page.waitForSelector(this.settingsSelectors.savingButton, {
        state: 'visible',
        timeout: 5000,
      });
      await this.page.waitForSelector(this.settingsSelectors.savingButton, {
        state: 'hidden',
        timeout: 10000,
      });
    } catch {
      // If saving button doesn't appear, operation might be instant
    }

    await this.waitForLoadingToComplete();
  }

  /**
   * Reset form values to initial state
   */
  async resetFormValues(): Promise<void> {
    const resetButton = this.page.locator(this.settingsSelectors.resetButton);
    const isResetVisible = await resetButton.isVisible().catch(() => false);

    if (isResetVisible) {
      await resetButton.click();
      await this.waitForLoadingToComplete();
    }
  }

  /**
   * Send test analytics event (development only)
   */
  async sendTestAnalyticsEvent(): Promise<void> {
    const analyticsSection = this.page.locator(
      this.settingsSelectors.analyticsTestSection,
    );
    const isAnalyticsAvailable = await analyticsSection
      .isVisible()
      .catch(() => false);

    if (!isAnalyticsAvailable) {
      throw new Error(
        'Analytics test functionality is not available in this environment',
      );
    }

    await this.page.click(this.settingsSelectors.analyticsTestButton);
    await this.waitForLoadingToComplete();
  }

  /**
   * Verify that changes are not saved when form is invalid
   */
  async verifyInvalidFormPrevention(): Promise<void> {
    // Fill invalid installation ID
    await this.updateInstallationId('');

    // Check that save button is disabled
    const isSaveEnabled = await this.isSaveButtonEnabled();
    expect(isSaveEnabled).toBe(false);
  }

  /**
   * Check if settings page has development-only features
   */
  async hasDevOnlyFeatures(): Promise<{
    hasResetSettings: boolean;
    hasAnalyticsTest: boolean;
  }> {
    const resetSection = this.page.locator(
      this.settingsSelectors.resetSettingsSection,
    );
    const analyticsSection = this.page.locator(
      this.settingsSelectors.analyticsTestSection,
    );

    const hasResetSettings = await resetSection.isVisible().catch(() => false);
    const hasAnalyticsTest = await analyticsSection
      .isVisible()
      .catch(() => false);

    return { hasResetSettings, hasAnalyticsTest };
  }
}
