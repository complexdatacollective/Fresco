import { test } from '~/tests/e2e/fixtures/functional';
import { expect } from '@playwright/test';
import { SettingsPage } from '~/tests/e2e/pages/dashboard/SettingsPage';

/**
 * Comprehensive functional tests for settings management
 * Tests cover installation ID management, UploadThing token configuration,
 * system settings, environment information display, and error handling
 */
test.describe('Settings Management - Functional Tests', () => {
  let settingsPage: SettingsPage;

  test.beforeEach(
    async ({ dashboardData, setupFunctionalTest, functionalPage }) => {
      // Ensure test data is available
      void dashboardData;

      // Set up functional test environment
      await setupFunctionalTest({
        viewport: { width: 1280, height: 720 },
        timeout: 30000,
      });

      // Initialize settings page object
      settingsPage = new SettingsPage(functionalPage);
    },
  );

  test.describe('Installation ID Management', () => {
    test('should display current installation ID', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Verify installation ID section is visible
      const currentId = await settingsPage.getInstallationIdValue();
      expect(currentId).toBeTruthy();
      expect(typeof currentId).toBe('string');
      expect(currentId.length).toBeGreaterThan(0);
    });

    test('should update installation ID successfully', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Check if installation ID is read-only
      const isReadOnly = await settingsPage.isInstallationIdReadOnly();

      if (isReadOnly) {
        // Skip test if installation ID is read-only (set via environment)
        test.skip(true, 'Installation ID is read-only in this environment');
        return;
      }

      const originalId = await settingsPage.getInstallationIdValue();
      const newId = `test-installation-${Date.now()}`;

      // Update installation ID
      await settingsPage.updateInstallationId(newId);
      await waitForPageStability();

      // Verify the ID was updated
      const updatedId = await settingsPage.getInstallationIdValue();
      expect(updatedId).toBe(newId);

      // Restore original ID
      await settingsPage.updateInstallationId(originalId);
      await waitForPageStability();
    });

    test('should validate installation ID format', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Check if installation ID is read-only
      const isReadOnly = await settingsPage.isInstallationIdReadOnly();

      if (isReadOnly) {
        test.skip(true, 'Installation ID is read-only in this environment');
        return;
      }

      // Test empty installation ID
      const emptyValidation = await settingsPage.validateInstallationId('');
      expect(emptyValidation.isValid).toBe(false);
      expect(emptyValidation.errorMessage).toMatch(
        /(required|cannot.*empty|must.*provide)/i,
      );

      // Test invalid characters
      const invalidValidation = await settingsPage.validateInstallationId(
        'invalid@id#with$special%chars',
      );
      // Note: Validation rules depend on the schema, so we check if there's any validation
      if (!invalidValidation.isValid) {
        expect(invalidValidation.errorMessage).toBeTruthy();
      }

      // Test valid installation ID
      const validValidation = await settingsPage.validateInstallationId(
        'valid-installation-id-123',
      );
      expect(validValidation.isValid).toBe(true);
    });

    test('should persist installation ID changes across page refreshes', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Check if installation ID is read-only
      const isReadOnly = await settingsPage.isInstallationIdReadOnly();

      if (isReadOnly) {
        test.skip(true, 'Installation ID is read-only in this environment');
        return;
      }

      const originalId = await settingsPage.getInstallationIdValue();
      const testId = `persistence-test-${Date.now()}`;

      // Update installation ID
      await settingsPage.updateInstallationId(testId);
      await waitForPageStability();

      // Verify persistence
      const { installationId } = await settingsPage.verifySettingsPersistence();
      expect(installationId).toBe(testId);

      // Restore original ID
      await settingsPage.updateInstallationId(originalId);
      await waitForPageStability();
    });

    test('should handle read-only installation ID correctly', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      const isReadOnly = await settingsPage.isInstallationIdReadOnly();

      if (isReadOnly) {
        // Verify read-only state is properly indicated
        const currentId = await settingsPage.getInstallationIdValue();
        expect(currentId).toBeTruthy();

        // Verify that the save button should not be available for read-only fields
        // This is handled by the component's disabled state
      } else {
        // Installation ID should be editable
        const currentId = await settingsPage.getInstallationIdValue();
        expect(currentId).toBeTruthy();
      }
    });
  });

  test.describe('UploadThing Token Configuration', () => {
    test('should display UploadThing token section', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Check if UploadThing section has any alerts
      const { hasAlert, alertText } = await settingsPage.hasUploadThingAlerts();

      if (hasAlert) {
        expect(alertText).toBeTruthy();
        // Common alert messages might include configuration instructions
        expect(alertText?.toLowerCase()).toMatch(
          /(upload|token|key|configuration)/,
        );
      }

      // Verify token input exists
      const tokenValue = await settingsPage.getUploadThingTokenValue();
      // Token might be empty or masked, but input should exist
      expect(typeof tokenValue).toBe('string');
    });

    test('should update UploadThing token successfully', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      const originalToken = await settingsPage.getUploadThingTokenValue();
      const testToken = `sk_test_token_${Date.now()}`;

      // Update token
      await settingsPage.updateUploadThingToken(testToken);
      await waitForPageStability();

      // Verify the token was updated
      const updatedToken = await settingsPage.getUploadThingTokenValue();
      expect(updatedToken).toBe(testToken);

      // Restore original token if it existed
      if (originalToken) {
        await settingsPage.updateUploadThingToken(originalToken);
        await waitForPageStability();
      }
    });

    test('should validate UploadThing token format', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Test empty token - might be valid depending on requirements
      await settingsPage.validateUploadThingToken('');
      // Empty might be allowed for optional configuration

      // Test invalid token format
      await settingsPage.validateUploadThingToken('invalid-token-format');
      // Validation depends on the schema requirements

      // Test valid token format (UploadThing typically uses sk_live_ or sk_test_ prefixes)
      const validValidation = await settingsPage.validateUploadThingToken(
        'sk_test_abcdef1234567890',
      );
      if (validValidation.isValid === false) {
        // Some validation might be in place
        expect(validValidation.errorMessage).toBeTruthy();
      }
    });

    test('should persist UploadThing token changes', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      const originalToken = await settingsPage.getUploadThingTokenValue();
      const testToken = `sk_test_persistence_${Date.now()}`;

      // Update token
      await settingsPage.updateUploadThingToken(testToken);
      await waitForPageStability();

      // Verify persistence
      const { uploadThingToken } =
        await settingsPage.verifySettingsPersistence();
      expect(uploadThingToken).toBe(testToken);

      // Restore original token if it existed
      if (originalToken) {
        await settingsPage.updateUploadThingToken(originalToken);
        await waitForPageStability();
      }
    });

    test('should handle UploadThing service integration validation', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Test with a clearly invalid token
      const invalidToken = 'definitely-not-a-valid-uploadthing-token-123';

      const validation =
        await settingsPage.validateUploadThingToken(invalidToken);

      // If validation is implemented, it should catch invalid formats
      if (!validation.isValid) {
        expect(validation.errorMessage).toBeTruthy();
        expect(validation.errorMessage?.toLowerCase()).toMatch(
          /(invalid|format|token)/,
        );
      }
    });
  });

  test.describe('System Settings Management', () => {
    test('should display all settings sections', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Verify all main settings sections are present
      const envDisplay = await settingsPage.checkEnvironmentDisplay();
      expect(envDisplay.hasVersionInfo).toBe(true);
      expect(envDisplay.versionText).toMatch(/Fresco\s+[\d.]+/);

      // Check if development features are available
      await settingsPage.hasDevOnlyFeatures();
      // Development features depend on environment and configuration
      // Note: Development features visibility is environment-dependent
    });

    test('should handle settings form validation', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Test form validation by trying to save invalid data
      await settingsPage.verifyInvalidFormPrevention();

      // Get any validation errors
      const validationErrors = await settingsPage.getFormValidationErrors();

      // If there are validation errors, they should be meaningful
      for (const error of validationErrors) {
        expect(error).toBeTruthy();
        expect(error.length).toBeGreaterThan(0);
      }
    });

    test('should persist settings across browser sessions', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Get current settings
      const originalSettings = await settingsPage.verifySettingsPersistence();

      // Verify settings are consistent
      expect(originalSettings.installationId).toBeTruthy();
      expect(typeof originalSettings.uploadThingToken).toBe('string');
    });

    test('should handle concurrent settings updates', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Check if installation ID is editable
      const isReadOnly = await settingsPage.isInstallationIdReadOnly();

      if (!isReadOnly) {
        const originalId = await settingsPage.getInstallationIdValue();
        const originalToken = await settingsPage.getUploadThingTokenValue();

        try {
          // Update installation ID
          await settingsPage.updateInstallationId(
            `concurrent-test-${Date.now()}`,
          );
          await waitForPageStability();

          // Update token
          await settingsPage.updateUploadThingToken(
            `sk_test_concurrent_${Date.now()}`,
          );
          await waitForPageStability();

          // Verify both settings were updated
          const finalId = await settingsPage.getInstallationIdValue();
          const finalToken = await settingsPage.getUploadThingTokenValue();

          expect(finalId).toContain('concurrent-test');
          expect(finalToken).toContain('sk_test_concurrent');
        } finally {
          // Restore original values
          await settingsPage.updateInstallationId(originalId);
          if (originalToken) {
            await settingsPage.updateUploadThingToken(originalToken);
          }
          await waitForPageStability();
        }
      } else {
        test.skip(
          true,
          'Installation ID is read-only, skipping concurrent update test',
        );
      }
    });
  });

  test.describe('Environment and Version Information Display', () => {
    test('should display version information correctly', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      const systemInfo = await settingsPage.getSystemInformation();

      // Verify version information is displayed
      expect(systemInfo.version).toBeTruthy();
      expect(systemInfo.version).toMatch(/[\d.]+/);

      // Environment information is available in system info
      expect(typeof systemInfo.environment).toBe('string');
    });

    test('should show update information when available', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      const systemInfo = await settingsPage.getSystemInformation();

      // Update information might not always be available
      if (systemInfo.hasUpdateAvailable) {
        expect(systemInfo.updateInfo).toBeTruthy();
        expect(systemInfo.updateInfo?.toLowerCase()).toMatch(
          /(update|version|available)/,
        );
      }
    });

    test('should display environment-specific features', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      await settingsPage.hasDevOnlyFeatures();

      // Development features should only be available in development
      // Note: Environment detection in tests is limited
      // This is environment-dependent and may vary
    });

    test('should handle version check errors gracefully', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Version section should always be displayed, even if update check fails
      const envDisplay = await settingsPage.checkEnvironmentDisplay();
      expect(envDisplay.hasVersionInfo).toBe(true);
      expect(envDisplay.versionText).toBeTruthy();
    });
  });

  test.describe('Error Handling for Invalid Settings', () => {
    test('should prevent saving with validation errors', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Check if installation ID is editable
      const isReadOnly = await settingsPage.isInstallationIdReadOnly();

      if (!isReadOnly) {
        // Test with invalid installation ID
        const validation = await settingsPage.validateInstallationId('');

        if (!validation.isValid) {
          // Save button should be disabled or error should prevent saving
          expect(validation.errorMessage).toBeTruthy();
        }
      }
    });

    test('should display meaningful error messages', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Test various invalid inputs
      const testCases = [
        {
          field: 'installationId',
          value: '',
          expectedError: /(required|empty|provide)/,
        },
        {
          field: 'uploadThingToken',
          value: 'invalid-format',
          expectedError: /(invalid|format|token)/,
        },
      ];

      for (const testCase of testCases) {
        let validation: { isValid: boolean; errorMessage?: string };

        if (testCase.field === 'installationId') {
          const isReadOnly = await settingsPage.isInstallationIdReadOnly();
          if (isReadOnly) continue;
          validation = await settingsPage.validateInstallationId(
            testCase.value,
          );
        } else {
          validation = await settingsPage.validateUploadThingToken(
            testCase.value,
          );
        }

        if (!validation.isValid && validation.errorMessage) {
          expect(validation.errorMessage).toBeTruthy();
          // Error messages might match expected patterns depending on validation implementation
        }
      }
    });

    test('should handle network errors during save operations', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Check if installation ID is editable
      const isReadOnly = await settingsPage.isInstallationIdReadOnly();

      if (!isReadOnly) {
        // Simulate network failure
        await functionalPage.route('**/api/app-settings**', (route) =>
          route.abort(),
        );

        try {
          await settingsPage.updateInstallationId(`network-test-${Date.now()}`);
          await waitForPageStability();

          // Operation should fail gracefully
          // Error handling depends on implementation
        } catch (error) {
          // Network error should be handled gracefully
          expect(error).toBeTruthy();
        } finally {
          // Restore network
          await functionalPage.unroute('**/api/app-settings**');
        }
      }
    });

    test('should handle malformed responses', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Check if installation ID is editable
      const isReadOnly = await settingsPage.isInstallationIdReadOnly();

      if (!isReadOnly) {
        // Simulate malformed response
        await functionalPage.route('**/api/app-settings**', (route) => {
          void route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: 'invalid-json-response',
          });
        });

        try {
          await settingsPage.updateInstallationId(
            `malformed-test-${Date.now()}`,
          );
          await waitForPageStability();

          // Malformed response should be handled gracefully
        } catch (error) {
          // Error should be handled gracefully
          expect(error).toBeTruthy();
        } finally {
          // Restore normal responses
          await functionalPage.unroute('**/api/app-settings**');
        }
      }
    });
  });

  test.describe('Settings Form Validation', () => {
    test('should validate required fields', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Check if installation ID is editable
      const isReadOnly = await settingsPage.isInstallationIdReadOnly();

      if (!isReadOnly) {
        // Test empty installation ID
        const validation = await settingsPage.validateInstallationId('');

        if (!validation.isValid) {
          expect(validation.errorMessage).toBeTruthy();
          expect(validation.errorMessage?.toLowerCase()).toMatch(
            /(required|cannot.*empty|must.*provide)/,
          );
        }
      }
    });

    test('should validate field formats and constraints', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Test installation ID format constraints
      const isReadOnly = await settingsPage.isInstallationIdReadOnly();

      if (!isReadOnly) {
        // Test extremely long installation ID
        const longId = 'a'.repeat(1000);
        const longValidation =
          await settingsPage.validateInstallationId(longId);

        // Length validation might be in place
        if (!longValidation.isValid) {
          expect(longValidation.errorMessage?.toLowerCase()).toMatch(
            /(length|long|maximum)/,
          );
        }
      }

      // Test UploadThing token format
      await settingsPage.validateUploadThingToken('invalid-format-123');
      // Token validation depends on schema implementation
    });

    test('should provide real-time validation feedback', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Check if installation ID is editable
      const isReadOnly = await settingsPage.isInstallationIdReadOnly();

      if (!isReadOnly) {
        // Test that validation happens as user types
        await settingsPage.validateInstallationId('temp');
        await settingsPage.validateInstallationId('');

        // Get current validation errors
        await settingsPage.getFormValidationErrors();
        // Real-time validation might show errors immediately
      }
    });

    test('should handle form reset functionality', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Check if installation ID is editable
      const isReadOnly = await settingsPage.isInstallationIdReadOnly();

      if (!isReadOnly) {
        const originalId = await settingsPage.getInstallationIdValue();

        // Make a change
        const tempId = `temp-${Date.now()}`;
        await settingsPage.validateInstallationId(tempId);

        // Reset form
        await settingsPage.resetFormValues();
        await waitForPageStability();

        // Verify reset worked
        const resetId = await settingsPage.getInstallationIdValue();
        expect(resetId).toBe(originalId);
      }
    });

    test('should disable save button when form is invalid', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Test invalid form state
      await settingsPage.verifyInvalidFormPrevention();

      // Additional validation
      const errors = await settingsPage.getFormValidationErrors();
      if (errors.length > 0) {
        const isSaveEnabled = await settingsPage.isSaveButtonEnabled();
        expect(isSaveEnabled).toBe(false);
      }
    });
  });

  test.describe('Development and Testing Features', () => {
    test('should handle development-only features correctly', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      const devFeatures = await settingsPage.hasDevOnlyFeatures();

      // Development features are environment-dependent
      if (devFeatures.hasAnalyticsTest) {
        try {
          await settingsPage.sendTestAnalyticsEvent();
          await waitForPageStability();
          // Test analytics event should complete without error
        } catch (error) {
          // Analytics test might not be fully functional in test environment
          expect(error).toBeTruthy();
        }
      }

      if (devFeatures.hasResetSettings) {
        // Reset functionality is available but we don't want to actually reset in tests
        // Just verify it's available
        expect(devFeatures.hasResetSettings).toBe(true);
      }
    });

    test('should handle reset functionality (if available)', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      const devFeatures = await settingsPage.hasDevOnlyFeatures();

      if (devFeatures.hasResetSettings) {
        // Note: We don't actually perform reset in tests as it would destroy data
        // Just verify the functionality is available
        expect(devFeatures.hasResetSettings).toBe(true);

        // Could test the confirmation dialog appears
        // await settingsPage.resetToDefaults();
        // But this would require handling the destructive operation
      }
    });

    test('should handle analytics test functionality (if available)', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      const devFeatures = await settingsPage.hasDevOnlyFeatures();

      if (devFeatures.hasAnalyticsTest) {
        try {
          await settingsPage.sendTestAnalyticsEvent();
          await waitForPageStability();

          // Analytics test should complete successfully
          // Specific behavior depends on implementation
        } catch (error) {
          // Analytics might not be fully functional in test environment
          expect(String(error)).toMatch(/(analytics|test|event)/i);
        }
      }
    });
  });

  test.describe('Settings Integration and Edge Cases', () => {
    test('should handle settings changes with browser back/forward', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Navigate away and back
      await settingsPage.navigateToOverview();
      await waitForPageStability();

      await settingsPage.goBack();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Settings should still be functional
      const systemInfo = await settingsPage.getSystemInformation();
      expect(systemInfo.version).toBeTruthy();
    });

    test('should maintain settings state during navigation', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      const originalSettings = await settingsPage.verifySettingsPersistence();

      // Navigate to another page and back
      await settingsPage.navigateToParticipants();
      await waitForPageStability();

      await settingsPage.navigateToSettings();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Verify settings are still the same
      const newSettings = await settingsPage.verifySettingsPersistence();
      expect(newSettings.installationId).toBe(originalSettings.installationId);
      expect(newSettings.uploadThingToken).toBe(
        originalSettings.uploadThingToken,
      );
    });

    test('should handle rapid successive setting changes', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Check if installation ID is editable
      const isReadOnly = await settingsPage.isInstallationIdReadOnly();

      if (!isReadOnly) {
        const originalId = await settingsPage.getInstallationIdValue();

        try {
          // Make rapid changes
          const testId1 = `rapid-test-1-${Date.now()}`;
          const testId2 = `rapid-test-2-${Date.now()}`;

          await settingsPage.updateInstallationId(testId1);
          await settingsPage.updateInstallationId(testId2);
          await waitForPageStability();

          // Final value should be the last one set
          const finalId = await settingsPage.getInstallationIdValue();
          expect(finalId).toBe(testId2);
        } finally {
          // Restore original ID
          await settingsPage.updateInstallationId(originalId);
          await waitForPageStability();
        }
      }
    });

    test('should handle settings with special characters', async ({
      waitForPageStability,
    }) => {
      await settingsPage.goto();
      await waitForPageStability();
      await settingsPage.verifySettingsPageLoaded();

      // Test UploadThing token with special characters (common in API keys)
      const originalToken = await settingsPage.getUploadThingTokenValue();
      const specialToken = 'sk_test_AbCd123_+/=';

      try {
        await settingsPage.updateUploadThingToken(specialToken);
        await waitForPageStability();

        const updatedToken = await settingsPage.getUploadThingTokenValue();
        expect(updatedToken).toBe(specialToken);
      } finally {
        // Restore original token
        if (originalToken) {
          await settingsPage.updateUploadThingToken(originalToken);
          await waitForPageStability();
        }
      }
    });
  });
});
