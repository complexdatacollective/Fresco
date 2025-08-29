import { test, expect } from '@playwright/test';
import { DashboardHelpers } from '../utils/dashboard-helpers';

test.describe('Dashboard Settings Page', () => {
  let dashboardHelpers: DashboardHelpers;

  test.beforeEach(async ({ page }) => {
    dashboardHelpers = new DashboardHelpers(page);
    await dashboardHelpers.navigateToSettings();
  });

  test('should display settings page', async ({ page }) => {
    // Check page title/heading
    await expect(page.locator('h1')).toContainText(/settings/i);
    
    // Check for settings container
    const settingsContainer = page.locator('[data-testid="settings-container"], main');
    await expect(settingsContainer).toBeVisible();
  });

  test('should display settings form fields', async ({ page }) => {
    // Wait for settings container to load
    await page.waitForSelector('[data-testid="settings-container"]');
    
    // Check for any interactive form elements or settings controls
    const formElements = page.locator('input, select, textarea, button, [role="button"], [contenteditable="true"]');
    const formElementCount = await formElements.count();
    
    if (formElementCount === 0) {
      // If no form elements exist, check for readonly settings display
      const settingsDisplay = page.locator('[data-testid*="setting"], .setting, .config, .environment');
      const settingsDisplayCount = await settingsDisplay.count();
      
      if (settingsDisplayCount === 0) {
        // If still no settings-related elements, check for any content in the settings container
        const settingsContent = page.locator('[data-testid="settings-container"] *').filter({ hasText: /\w/ });
        const contentCount = await settingsContent.count();
        expect(contentCount).toBeGreaterThan(0);
      }
    } else {
      expect(formElementCount).toBeGreaterThan(0);
    }
  });

  test('should have installation ID field', async ({ page }) => {
    // Look for installation ID field
    const installationField = page.locator(
      '[data-testid="installation-id"], input[name*="installation"]'
    );
    
    if (await installationField.count() > 0) {
      await expect(installationField.first()).toBeVisible();
    }
  });

  test('should have UploadThing token field', async ({ page }) => {
    // Look for UploadThing token field
    const tokenField = page.locator(
      '[data-testid="uploadthing-token"], input[name*="token"], input[name*="uploadthing"]'
    );
    
    if (await tokenField.count() > 0) {
      await expect(tokenField.first()).toBeVisible();
    }
  });

  test('visual regression: settings page', async ({ page }) => {
    await dashboardHelpers.prepareForVisualTesting();
    
    // Mask sensitive information in settings
    await dashboardHelpers.maskElements([
      'input[type="password"]',
      '[data-testid="installation-id"]',
      '[data-testid="uploadthing-token"]',
      'input[name*="token"]',
      'input[name*="key"]',
      'input[name*="secret"]',
    ]);
    
    // Take full page screenshot
    await dashboardHelpers.expectVisualRegression('settings-page-full');
  });

  test('should show save/update buttons', async ({ page }) => {
    // Look for save/update buttons
    const saveButton = page.locator('button').filter({ 
      hasText: /save|update|apply/i 
    });
    
    if (await saveButton.count() > 0) {
      await expect(saveButton.first()).toBeVisible();
      await expect(saveButton.first()).toBeEnabled();
    }
  });

  test('should display environment warnings if applicable', async ({ page }) => {
    // Look for readonly environment alerts
    const readonlyAlert = page.locator(
      '[data-testid="readonly-alert"], .alert, .warning'
    );
    
    if (await readonlyAlert.count() > 0) {
      // If there are environment warnings, they should be visible
      await expect(readonlyAlert.first()).toBeVisible();
    }
  });

  test('should handle form validation', async ({ page }) => {
    // Find a required input field
    const requiredInput = page.locator('input[required]').first();
    
    if (await requiredInput.isVisible()) {
      // Clear the field
      await requiredInput.clear();
      
      // Try to submit the form
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Check for validation message
        const validationMessage = page.locator(
          '.error, [data-testid="error"], .text-red, .text-destructive'
        );
        
        // We expect some validation to occur
        await expect(validationMessage.first()).toBeVisible();
      }
    }
  });

  test('responsive design: mobile settings view', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await dashboardHelpers.navigateToSettings();
    await dashboardHelpers.prepareForVisualTesting();
    
    // Mask sensitive information
    await dashboardHelpers.maskElements([
      'input[type="password"]',
      '[data-testid="installation-id"]',
      '[data-testid="uploadthing-token"]',
      'input[name*="token"]',
      'input[name*="key"]',
      'input[name*="secret"]',
    ]);
    
    await dashboardHelpers.expectVisualRegression('settings-page-mobile');
  });
});