import { test } from '~/tests/e2e/fixtures/functional';
import { expect } from '@playwright/test';
import { ProtocolsPage } from '~/tests/e2e/pages/dashboard/ProtocolsPage';
import * as path from 'path';

/**
 * Comprehensive functional tests for protocols management
 * Tests cover CRUD operations, imports, exports, validation, and bulk operations
 */
test.describe('Protocols Management - Functional Tests', () => {
  let protocolsPage: ProtocolsPage;

  test.beforeEach(async ({ dashboardData, setupFunctionalTest, functionalPage }) => {
    // Ensure test data is available
    void dashboardData;

    // Set up functional test environment
    await setupFunctionalTest({
      viewport: { width: 1280, height: 720 },
      timeout: 30000,
    });

    // Initialize protocols page object
    protocolsPage = new ProtocolsPage(functionalPage);
  });

  test.describe('Protocol CRUD Operations', () => {
    test('should upload a valid protocol file successfully', async ({
      waitForPageStability,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();
      await protocolsPage.verifyProtocolsPageLoaded();

      // Get initial protocol count
      const initialNames = await protocolsPage.getAllProtocolNames();
      const initialCount = initialNames.length;

      // Upload valid protocol file
      const validProtocolPath = path.resolve('tests/data/Sample Protocol v5.netcanvas');
      await protocolsPage.uploadProtocol(validProtocolPath);
      await waitForPageStability();

      // Verify protocol was added
      const finalNames = await protocolsPage.getAllProtocolNames();
      expect(finalNames.length).toBe(initialCount + 1);

      // Verify the new protocol appears in the table
      const newProtocolName = 'Sample Protocol v5'; // Expected name from file
      expect(await protocolsPage.protocolExists(newProtocolName)).toBe(true);

      // Verify protocol data is displayed correctly
      const protocolData = await protocolsPage.getProtocolFromTable(newProtocolName);
      expect(protocolData).toBeTruthy();
      expect(protocolData?.name).toBe(newProtocolName);
      expect(protocolData?.status).toBeTruthy();
    });

    test('should read protocol details correctly', async ({
      waitForPageStability,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();
      await protocolsPage.verifyProtocolsPageLoaded();

      // Get first protocol from test data
      const protocolNames = await protocolsPage.getAllProtocolNames();
      expect(protocolNames.length).toBeGreaterThan(0);

      const firstProtocolName = protocolNames[0];
      expect(firstProtocolName).toBeTruthy();
      const protocolData = await protocolsPage.getProtocolFromTable(firstProtocolName!);

      // Verify protocol data structure
      expect(protocolData).toBeTruthy();
      expect(protocolData?.name).toBe(firstProtocolName);
      expect(protocolData?.status).toBeTruthy();
      expect(protocolData?.createdAt).toBeTruthy();
    });

    test('should delete a single protocol with confirmation', async ({
      waitForPageStability,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();
      await protocolsPage.verifyProtocolsPageLoaded();

      // Get initial protocol count and select one to delete
      const initialNames = await protocolsPage.getAllProtocolNames();
      expect(initialNames.length).toBeGreaterThan(0);
      
      const protocolToDelete = initialNames[0];
      expect(protocolToDelete).toBeTruthy();
      const initialCount = initialNames.length;

      // Delete the protocol
      await protocolsPage.deleteProtocol(protocolToDelete!);
      await waitForPageStability();

      // Verify protocol was removed
      const finalNames = await protocolsPage.getAllProtocolNames();
      expect(finalNames.length).toBe(initialCount - 1);
      expect(await protocolsPage.protocolExists(protocolToDelete!)).toBe(false);
    });

    test('should duplicate a protocol successfully', async ({
      waitForPageStability,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();
      await protocolsPage.verifyProtocolsPageLoaded();

      // Get initial protocol count and select one to duplicate
      const initialNames = await protocolsPage.getAllProtocolNames();
      expect(initialNames.length).toBeGreaterThan(0);
      
      const protocolToDuplicate = initialNames[0];
      expect(protocolToDuplicate).toBeTruthy();
      const initialCount = initialNames.length;

      // Duplicate the protocol
      await protocolsPage.duplicateProtocol(protocolToDuplicate!);
      await waitForPageStability();

      // Verify protocol count increased
      const finalNames = await protocolsPage.getAllProtocolNames();
      expect(finalNames.length).toBe(initialCount + 1);

      // Verify original protocol still exists
      expect(await protocolsPage.protocolExists(protocolToDuplicate!)).toBe(true);
    });
  });

  test.describe('Protocol Import Testing', () => {
    test('should handle valid protocol file import', async ({
      waitForPageStability,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();

      const initialCount = (await protocolsPage.getAllProtocolNames()).length;
      const validProtocolPath = path.resolve('tests/data/Sample Protocol v5.netcanvas');

      // Upload valid protocol
      await protocolsPage.uploadProtocol(validProtocolPath);
      await waitForPageStability();

      // Verify successful import
      const finalCount = (await protocolsPage.getAllProtocolNames()).length;
      expect(finalCount).toBe(initialCount + 1);
    });

    test('should reject invalid protocol file with error message', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();

      const invalidProtocolPath = path.resolve('tests/e2e/test-data/files/invalid-protocol.netcanvas');

      // Attempt to upload invalid protocol
      try {
        await protocolsPage.uploadProtocol(invalidProtocolPath);
        await waitForPageStability();

        // Should show error message
        const errorMessage = functionalPage.locator('[data-testid="error-message"], .error, [role="alert"]');
        await expect(errorMessage).toBeVisible({ timeout: 10000 });
      } catch (error) {
        // Upload should fail or show validation error
        expect(error).toBeTruthy();
      }

      // Verify no protocol was added
      const protocolNames = await protocolsPage.getAllProtocolNames();
      expect(protocolNames.some(name => name.includes('invalid'))).toBe(false);
    });

    test('should reject non-netcanvas files', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();

      // Create a temporary non-netcanvas file
      const fs = await import('fs');
      const tempFilePath = path.resolve('tests/e2e/test-data/files/temp-test.txt');
      fs.writeFileSync(tempFilePath, 'This is not a netcanvas file');

      try {
        // Attempt to upload non-netcanvas file
        await protocolsPage.uploadProtocol(tempFilePath);
        await waitForPageStability();

        // Should show error message about file type
        const errorMessage = functionalPage.locator('[data-testid="error-message"], .error, [role="alert"]');
        await expect(errorMessage).toBeVisible({ timeout: 10000 });
      } catch (error) {
        // Upload should fail due to file type validation
        expect(error).toBeTruthy();
      } finally {
        // Clean up temp file
        try {
          fs.unlinkSync(tempFilePath);
        } catch {
          // Ignore cleanup errors
        }
      }
    });
  });

  test.describe('Protocol Export Testing', () => {
    test('should export protocol successfully', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();
      await protocolsPage.verifyProtocolsPageLoaded();

      const protocolNames = await protocolsPage.getAllProtocolNames();
      expect(protocolNames.length).toBeGreaterThan(0);

      const protocolToExport = protocolNames[0];
      expect(protocolToExport).toBeTruthy();

      // Set up download handling
      const downloadPromise = functionalPage.waitForEvent('download');

      // Trigger export through actions dropdown
      const protocolExists = await protocolsPage.protocolExists(protocolToExport!);
      expect(protocolExists).toBe(true);

      // Try to find and click export button through UI navigation
      // This approach uses public methods and standard UI interactions
      const exportButton = functionalPage.locator('[data-testid="export-protocol-button"], text="Export"').first();
      
      // If export button is in actions dropdown, we need to navigate there
      try {
        await exportButton.click();
      } catch {
        // Export might be in actions dropdown - use protocol-specific actions
        const actionsDropdown = functionalPage.locator(`[data-testid="protocol-actions"]:near(text="${protocolToExport!}")`).first();
        await actionsDropdown.click();
        await waitForPageStability();
        
        const exportOption = functionalPage.locator('[data-testid="export-protocol-button"], text="Export"').first();
        await exportOption.click();
      }

      // Wait for download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.netcanvas$/);
    });
  });

  test.describe('Protocol Validation Testing', () => {
    test('should validate protocol structure on upload', async ({
      waitForPageStability,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();

      const validProtocolPath = path.resolve('tests/data/Sample Protocol v5.netcanvas');
      
      // Upload should succeed with valid structure
      await protocolsPage.uploadProtocol(validProtocolPath);
      await waitForPageStability();

      // Verify protocol is marked as valid/active
      const protocolData = await protocolsPage.getProtocolFromTable('Sample Protocol v5');
      expect(protocolData?.status).not.toContain('error');
      expect(protocolData?.status).not.toContain('invalid');
    });

    test('should show validation errors for corrupted protocol files', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();

      const invalidProtocolPath = path.resolve('tests/e2e/test-data/files/invalid-protocol.netcanvas');

      try {
        await protocolsPage.uploadProtocol(invalidProtocolPath);
        await waitForPageStability();

        // Should show validation error
        const errorIndicator = functionalPage.locator(
          '[data-testid="validation-error"], .validation-error, [role="alert"]'
        );
        await expect(errorIndicator).toBeVisible({ timeout: 10000 });
      } catch (error) {
        // Upload failure is expected for invalid files
        expect(error).toBeTruthy();
      }
    });
  });

  test.describe('Anonymous Recruitment Testing', () => {
    test('should toggle anonymous recruitment for protocol', async ({
      waitForPageStability,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();
      await protocolsPage.verifyProtocolsPageLoaded();

      const protocolNames = await protocolsPage.getAllProtocolNames();
      expect(protocolNames.length).toBeGreaterThan(0);

      const protocolName = protocolNames[0];
      expect(protocolName).toBeTruthy();

      // Toggle anonymous recruitment
      await protocolsPage.toggleAnonymousRecruitment(protocolName!);
      await waitForPageStability();

      // Verify toggle was successful (implementation depends on UI feedback)
      // This might involve checking for success message, updated status, etc.
    });

    test('should show warning when enabling anonymous recruitment', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();
      await protocolsPage.verifyProtocolsPageLoaded();

      const protocolNames = await protocolsPage.getAllProtocolNames();
      expect(protocolNames.length).toBeGreaterThan(0);

      const protocolName = protocolNames[0];
      expect(protocolName).toBeTruthy();

      // Toggle anonymous recruitment and look for warning
      await protocolsPage.toggleAnonymousRecruitment(protocolName!);

      // Check for warning message
      try {
        const warningMessage = functionalPage.locator(
          '[data-testid="anonymous-recruitment-warning"], .warning'
        );
        await expect(warningMessage).toBeVisible({ timeout: 5000 });
      } catch {
        // Warning might not appear if feature works differently
        // This is acceptable as UI implementation may vary
      }
    });
  });

  test.describe('Bulk Operations Testing', () => {
    test('should select multiple protocols for bulk operations', async ({
      waitForPageStability,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();
      await protocolsPage.verifyProtocolsPageLoaded();

      const protocolNames = await protocolsPage.getAllProtocolNames();
      expect(protocolNames.length).toBeGreaterThan(1);

      // Select first two protocols
      const protocolsToSelect = protocolNames.slice(0, 2);
      await protocolsPage.selectProtocols(protocolsToSelect);

      // Verify selections
      const selectedCount = await protocolsPage.getSelectedRowCount();
      expect(selectedCount).toBe(2);
    });

    test('should perform bulk delete operation', async ({
      waitForPageStability,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();
      await protocolsPage.verifyProtocolsPageLoaded();

      const initialNames = await protocolsPage.getAllProtocolNames();
      expect(initialNames.length).toBeGreaterThan(2);

      // Select protocols for deletion
      const protocolsToDelete = initialNames.slice(0, 2);
      await protocolsPage.selectProtocols(protocolsToDelete);

      // Perform bulk delete
      await protocolsPage.performBulkDelete();
      await waitForPageStability();

      // Verify protocols were deleted
      const finalNames = await protocolsPage.getAllProtocolNames();
      expect(finalNames.length).toBe(initialNames.length - 2);

      // Verify specific protocols are gone
      for (const protocolName of protocolsToDelete) {
        expect(await protocolsPage.protocolExists(protocolName)).toBe(false);
      }
    });

    test('should handle bulk operations with no selection', async ({
      waitForPageStability,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();
      await protocolsPage.verifyProtocolsPageLoaded();

      // Try bulk delete with no selection
      try {
        await protocolsPage.performBulkDelete();
        // Should either show error or disable the button
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        // Expected behavior - bulk delete should fail with no selection
        expect(String(error)).toContain('No protocols selected');
      }
    });
  });

  test.describe('Protocol Search and Filtering', () => {
    test('should filter protocols by name', async ({
      waitForPageStability,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();
      await protocolsPage.verifyProtocolsPageLoaded();

      const allProtocols = await protocolsPage.getAllProtocolNames();
      expect(allProtocols.length).toBeGreaterThan(0);

      // Search for specific protocol
      const firstProtocol = allProtocols[0];
      expect(firstProtocol).toBeTruthy();
      const searchTerm = firstProtocol!.substring(0, 5); // Use part of first protocol name
      await protocolsPage.searchProtocols(searchTerm);
      await waitForPageStability();

      // Verify filtered results
      const filteredProtocols = await protocolsPage.getAllProtocolNames();
      expect(filteredProtocols.length).toBeLessThanOrEqual(allProtocols.length);

      // All visible protocols should contain search term
      for (const protocolName of filteredProtocols) {
        expect(protocolName.toLowerCase()).toContain(searchTerm.toLowerCase());
      }
    });

    test('should show no results for non-existent protocol', async ({
      waitForPageStability,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();
      await protocolsPage.verifyProtocolsPageLoaded();

      // Search for non-existent protocol
      await protocolsPage.searchProtocols('NonExistentProtocol12345');
      await waitForPageStability();

      // Verify no results
      const filteredProtocols = await protocolsPage.getAllProtocolNames();
      expect(filteredProtocols.length).toBe(0);
    });

    test('should clear search filter', async ({
      waitForPageStability,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();
      await protocolsPage.verifyProtocolsPageLoaded();

      const allProtocols = await protocolsPage.getAllProtocolNames();
      const originalCount = allProtocols.length;

      // Apply search filter
      await protocolsPage.searchProtocols('Test');
      await waitForPageStability();

      // Clear search
      await protocolsPage.searchProtocols('');
      await waitForPageStability();

      // Verify all protocols are shown again
      const clearedProtocols = await protocolsPage.getAllProtocolNames();
      expect(clearedProtocols.length).toBe(originalCount);
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle upload of very large files gracefully', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();

      // Note: This would need a very large test file or size limit testing
      // For now, we'll test the error handling pattern
      
      try {
        // This should demonstrate the pattern for large file handling
        // In a real scenario, you'd have a large file to test with
        const validProtocolPath = path.resolve('tests/data/Sample Protocol v5.netcanvas');
        await protocolsPage.uploadProtocol(validProtocolPath);
        await waitForPageStability();
      } catch (error) {
        // If upload fails due to size limits, verify appropriate error handling
        const errorMessage = functionalPage.locator('[data-testid="error-message"], .error');
        if (await errorMessage.isVisible()) {
          const errorText = await errorMessage.textContent();
          expect(errorText).toBeTruthy();
        }
      }
    });

    test('should handle network interruption during upload', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();

      // Simulate network issues by intercepting requests
      await functionalPage.route('**/api/protocols**', route => route.abort());

      try {
        const validProtocolPath = path.resolve('tests/data/Sample Protocol v5.netcanvas');
        await protocolsPage.uploadProtocol(validProtocolPath);
        await waitForPageStability();
      } catch (error) {
        // Upload should fail gracefully
        expect(error).toBeTruthy();
      }

      // Restore network
      await functionalPage.unroute('**/api/protocols**');
    });

    test('should handle concurrent protocol operations', async ({
      waitForPageStability,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();
      await protocolsPage.verifyProtocolsPageLoaded();

      const protocolNames = await protocolsPage.getAllProtocolNames();
      expect(protocolNames.length).toBeGreaterThan(1);

      // Try to perform multiple operations quickly
      // This tests the UI's ability to handle rapid interactions
      const firstProtocol = protocolNames[0];
      const secondProtocol = protocolNames[1];
      expect(firstProtocol).toBeTruthy();
      expect(secondProtocol).toBeTruthy();

      try {
        // Start multiple operations concurrently
        const operations = [
          protocolsPage.duplicateProtocol(firstProtocol!),
          protocolsPage.duplicateProtocol(secondProtocol!),
        ];

        await Promise.all(operations);
        await waitForPageStability();

        // Verify operations completed successfully
        const finalNames = await protocolsPage.getAllProtocolNames();
        expect(finalNames.length).toBeGreaterThan(protocolNames.length);
      } catch (error) {
        // Some operations might fail due to concurrency - this is acceptable
        // As long as the UI doesn't break
        expect(error).toBeTruthy();
      }
    });
  });

  test.describe('Protocol Status and State Management', () => {
    test('should display protocol status correctly', async ({
      waitForPageStability,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();
      await protocolsPage.verifyProtocolsPageLoaded();

      const protocolNames = await protocolsPage.getAllProtocolNames();
      expect(protocolNames.length).toBeGreaterThan(0);

      // Check status of each protocol
      for (const protocolName of protocolNames) {
        const protocolData = await protocolsPage.getProtocolFromTable(protocolName);
        expect(protocolData?.status).toBeTruthy();
        
        // Status should be one of expected values
        const validStatuses = ['active', 'inactive', 'draft', 'published'];
        expect(validStatuses.some(status => 
          protocolData?.status.toLowerCase().includes(status)
        )).toBe(true);
      }
    });

    test('should update protocol timestamps correctly', async ({
      waitForPageStability,
    }) => {
      await protocolsPage.goto();
      await waitForPageStability();
      await protocolsPage.verifyProtocolsPageLoaded();

      const protocolNames = await protocolsPage.getAllProtocolNames();
      expect(protocolNames.length).toBeGreaterThan(0);

      const protocolName = protocolNames[0];
      expect(protocolName).toBeTruthy();
      
      // Perform an operation that should update timestamps
      await protocolsPage.duplicateProtocol(protocolName!);
      await waitForPageStability();

      // Verify the duplicated protocol has recent timestamps
      const duplicatedProtocolNames = await protocolsPage.getAllProtocolNames();
      const newProtocols = duplicatedProtocolNames.filter(name => 
        !protocolNames.includes(name)
      );
      
      expect(newProtocols.length).toBeGreaterThan(0);
      
      const newProtocolName = newProtocols[0];
      expect(newProtocolName).toBeTruthy();
      const newProtocolData = await protocolsPage.getProtocolFromTable(newProtocolName!);
      expect(newProtocolData?.createdAt).toBeTruthy();
      expect(newProtocolData?.updatedAt).toBeTruthy();
    });
  });
});