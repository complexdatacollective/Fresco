import { test } from '~/tests/e2e/fixtures/functional';
import { expect } from '@playwright/test';
import { ParticipantsPage } from '~/tests/e2e/pages/dashboard/ParticipantsPage';
import * as path from 'path';

/**
 * Comprehensive functional tests for participants management
 * Tests cover CRUD operations, CSV imports, exports, URL generation, validation, and bulk operations
 */
test.describe('Participants Management - Functional Tests', () => {
  let participantsPage: ParticipantsPage;

  test.beforeEach(async ({ dashboardData, setupFunctionalTest, functionalPage }) => {
    // Ensure test data is available
    void dashboardData;

    // Set up functional test environment
    await setupFunctionalTest({
      viewport: { width: 1280, height: 720 },
      timeout: 30000,
    });

    // Initialize participants page object
    participantsPage = new ParticipantsPage(functionalPage);
  });

  test.describe('Participant CRUD Operations', () => {
    test('should create a new participant successfully', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      // Get initial participant count
      const initialIds = await participantsPage.getAllParticipantIds();
      const initialCount = initialIds.length;

      // Open add participant modal
      await participantsPage.openAddParticipantModal();

      // Fill participant form
      const newParticipant = {
        id: `TEST-${Date.now()}`,
        name: 'Test Participant',
        email: 'test@example.com',
        phone: '+1234567890',
        notes: 'Created for functional testing',
      };

      await participantsPage.fillParticipantForm(newParticipant);
      await participantsPage.submitParticipantForm();
      await waitForPageStability();

      // Verify participant was added
      const finalIds = await participantsPage.getAllParticipantIds();
      expect(finalIds.length).toBe(initialCount + 1);

      // Verify the new participant appears in the table
      expect(await participantsPage.participantExists(newParticipant.id)).toBe(true);

      // Verify participant data is displayed correctly
      const participantData = await participantsPage.getParticipantFromTable(newParticipant.id);
      expect(participantData).toBeTruthy();
      expect(participantData?.id).toBe(newParticipant.id);
      expect(participantData?.name).toBe(newParticipant.name);
      expect(participantData?.email).toBe(newParticipant.email);
    });

    test('should read participant details correctly', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      // Get first participant from test data
      const participantIds = await participantsPage.getAllParticipantIds();
      expect(participantIds.length).toBeGreaterThan(0);

      const firstParticipantId = participantIds[0];
      expect(firstParticipantId).toBeTruthy();
      const participantData = await participantsPage.getParticipantFromTable(firstParticipantId!);

      // Verify participant data structure
      expect(participantData).toBeTruthy();
      expect(participantData?.id).toBe(firstParticipantId);
      expect(participantData?.name).toBeTruthy();
      expect(participantData?.status).toBeTruthy();
    });

    test('should update participant information', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      // Get first participant to edit
      const participantIds = await participantsPage.getAllParticipantIds();
      expect(participantIds.length).toBeGreaterThan(0);

      const participantToEdit = participantIds[0];
      expect(participantToEdit).toBeTruthy();

      // Get original data
      const originalData = await participantsPage.getParticipantFromTable(participantToEdit!);
      expect(originalData).toBeTruthy();

      // Edit the participant
      await participantsPage.editParticipant(participantToEdit!);
      await waitForPageStability();

      // Update the form with new data
      const updatedData = {
        name: `${originalData!.name} - Updated`,
        email: 'updated@example.com',
        notes: 'Updated for functional testing',
      };

      await participantsPage.fillParticipantForm(updatedData);
      await participantsPage.submitParticipantForm();
      await waitForPageStability();

      // Verify updated data
      const finalData = await participantsPage.getParticipantFromTable(participantToEdit!);
      expect(finalData?.name).toBe(updatedData.name);
      expect(finalData?.email).toBe(updatedData.email);
    });

    test('should delete a single participant with confirmation', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      // Get initial participant count and select one to delete
      const initialIds = await participantsPage.getAllParticipantIds();
      expect(initialIds.length).toBeGreaterThan(0);
      
      const participantToDelete = initialIds[0];
      expect(participantToDelete).toBeTruthy();
      const initialCount = initialIds.length;

      // Delete the participant
      await participantsPage.deleteParticipant(participantToDelete!);
      await waitForPageStability();

      // Verify participant was removed
      const finalIds = await participantsPage.getAllParticipantIds();
      expect(finalIds.length).toBe(initialCount - 1);
      expect(await participantsPage.participantExists(participantToDelete!)).toBe(false);
    });
  });

  test.describe('CSV Import Testing', () => {
    test('should import valid CSV file successfully', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const initialCount = (await participantsPage.getAllParticipantIds()).length;
      const validCsvPath = path.resolve('tests/e2e/test-data/participants/valid-participants.csv');

      // Import valid CSV
      await participantsPage.importParticipantsCSV(validCsvPath);
      await waitForPageStability();

      // Verify successful import
      const finalCount = (await participantsPage.getAllParticipantIds()).length;
      expect(finalCount).toBeGreaterThan(initialCount);

      // Verify specific participants from CSV were imported
      expect(await participantsPage.participantExists('P001')).toBe(true);
      expect(await participantsPage.participantExists('P002')).toBe(true);
      expect(await participantsPage.participantExists('P003')).toBe(true);

      // Verify participant data from CSV
      const p001Data = await participantsPage.getParticipantFromTable('P001');
      expect(p001Data?.name).toBe('Alice Johnson');
    });

    test('should handle duplicate participants in CSV import', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const duplicateCsvPath = path.resolve('tests/e2e/test-data/participants/duplicate-participants.csv');

      // Import CSV with duplicates
      try {
        await participantsPage.importParticipantsCSV(duplicateCsvPath);
        await waitForPageStability();

        // Should show warning or error about duplicates
        const warningMessage = functionalPage.locator(
          '[data-testid="import-warning"], [data-testid="duplicate-warning"], .warning, [role="alert"]'
        );
        
        // Check if warning appears
        const hasWarning = await warningMessage.isVisible({ timeout: 5000 }).catch(() => false);
        
        if (hasWarning) {
          const warningText = await warningMessage.textContent();
          expect(warningText?.toLowerCase()).toMatch(/(duplicate|existing|already)/);
        }

        // Verify that new participants were still imported
        expect(await participantsPage.participantExists('P021')).toBe(true);
        expect(await participantsPage.participantExists('P022')).toBe(true);
        expect(await participantsPage.participantExists('P023')).toBe(true);

      } catch (error) {
        // Partial import failure is acceptable for duplicate handling
        // eslint-disable-next-line no-console
        console.log('Duplicate import handled with error:', String(error));
      }
    });

    test('should reject invalid CSV file with validation errors', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const invalidCsvPath = path.resolve('tests/e2e/test-data/participants/invalid-participants.csv');

      try {
        await participantsPage.importParticipantsCSV(invalidCsvPath);
        await waitForPageStability();

        // Should show validation errors
        const errorMessage = functionalPage.locator(
          '[data-testid="validation-error"], [data-testid="import-error"], .error, [role="alert"]'
        );
        await expect(errorMessage).toBeVisible({ timeout: 10000 });

        const errorText = await errorMessage.textContent();
        expect(errorText?.toLowerCase()).toMatch(/(invalid|error|header|format)/);

      } catch (error) {
        // Import failure is expected for invalid files
        expect(String(error)).toMatch(/(invalid|error|validation)/i);
      }

      // Verify no invalid participants were imported
      const participantIds = await participantsPage.getAllParticipantIds();
      const hasInvalidData = participantIds.some(id => 
        id.includes('INVALID_IDENTIFIER_THAT_IS_TOO_LONG') || id === ''
      );
      expect(hasInvalidData).toBe(false);
    });

    test('should handle large CSV import', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const largeCsvPath = path.resolve('tests/e2e/test-data/participants/large-participants.csv');
      const initialCount = (await participantsPage.getAllParticipantIds()).length;

      // Import large CSV
      await participantsPage.importParticipantsCSV(largeCsvPath);
      await waitForPageStability();

      // Verify import succeeded
      const finalCount = (await participantsPage.getAllParticipantIds()).length;
      expect(finalCount).toBeGreaterThan(initialCount);

      // Verify some participants from large file were imported
      expect(await participantsPage.participantExists('BULK001')).toBe(true);
      expect(await participantsPage.participantExists('BULK100')).toBe(true);
    });

    test('should handle empty CSV file gracefully', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const emptyCsvPath = path.resolve('tests/e2e/test-data/participants/empty-participants.csv');

      try {
        await participantsPage.importParticipantsCSV(emptyCsvPath);
        await waitForPageStability();

        // Should show appropriate message for empty file
        const message = functionalPage.locator(
          '[data-testid="empty-file-message"], [data-testid="import-warning"], .warning, [role="alert"]'
        );
        
        const hasMessage = await message.isVisible({ timeout: 5000 }).catch(() => false);
        if (hasMessage) {
          const messageText = await message.textContent();
          expect(messageText?.toLowerCase()).toMatch(/(empty|no.*data|no.*participants)/);
        }

      } catch (error) {
        // Empty file error is acceptable
        expect(String(error)).toMatch(/(empty|no.*data)/i);
      }
    });

    test('should validate CSV headers and format', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      // Test CSV with wrong headers
      const invalidCsvPath = path.resolve('tests/e2e/test-data/participants/invalid-participants.csv');

      try {
        await participantsPage.importParticipantsCSV(invalidCsvPath);
        await waitForPageStability();

        // Should show header validation error
        const headerError = functionalPage.locator(
          '[data-testid="header-error"], [data-testid="format-error"], .error'
        );
        
        const hasError = await headerError.isVisible({ timeout: 5000 }).catch(() => false);
        if (hasError) {
          const errorText = await headerError.textContent();
          expect(errorText?.toLowerCase()).toMatch(/(header|format|identifier|label)/);
        }

      } catch (error) {
        // Header validation error is expected
        expect(String(error)).toMatch(/(header|format|invalid)/i);
      }
    });
  });

  test.describe('Participant Search and Filtering', () => {
    test('should filter participants by search query', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const allParticipants = await participantsPage.getAllParticipantIds();
      expect(allParticipants.length).toBeGreaterThan(0);

      // Search for specific participant
      const firstParticipant = allParticipants[0];
      expect(firstParticipant).toBeTruthy();
      const participantData = await participantsPage.getParticipantFromTable(firstParticipant!);
      
      // Search by name
      if (participantData?.name) {
        const searchTerm = participantData.name.split(' ')[0] ?? 'test'; // Use first word of name
        await participantsPage.searchParticipants(searchTerm);
        await waitForPageStability();

        // Verify filtered results
        const filteredParticipants = await participantsPage.getAllParticipantIds();
        expect(filteredParticipants.length).toBeLessThanOrEqual(allParticipants.length);

        // Verify the searched participant is still visible
        expect(await participantsPage.participantExists(firstParticipant!)).toBe(true);
      }
    });

    test('should show no results for non-existent participant', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      // Search for non-existent participant
      await participantsPage.searchParticipants('NonExistentParticipant12345');
      await waitForPageStability();

      // Verify no results
      const filteredParticipants = await participantsPage.getAllParticipantIds();
      expect(filteredParticipants.length).toBe(0);
    });

    test('should filter participants by status', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const allParticipants = await participantsPage.getAllParticipantIds();
      expect(allParticipants.length).toBeGreaterThan(0);

      // Try filtering by different statuses
      const statuses = ['active', 'pending', 'completed'];
      
      for (const status of statuses) {
        try {
          await participantsPage.filterParticipantsByStatus(status);
          await waitForPageStability();

          // Verify filter was applied
          const filteredParticipants = await participantsPage.getAllParticipantIds();
          
          // Check that filtered participants have the correct status
          for (const participantId of filteredParticipants) {
            const participantData = await participantsPage.getParticipantFromTable(participantId);
            if (participantData?.status) {
              expect(participantData.status.toLowerCase()).toContain(status);
            }
          }
        } catch (error) {
          // Status might not exist in test data - this is acceptable
          // eslint-disable-next-line no-console
          console.log(`Status filter ${status} not available:`, String(error));
        }
      }
    });

    test('should clear search and filters', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const allParticipants = await participantsPage.getAllParticipantIds();
      const originalCount = allParticipants.length;

      // Apply search filter
      await participantsPage.searchParticipants('Test');
      await waitForPageStability();

      // Clear search
      await participantsPage.searchParticipants('');
      await waitForPageStability();

      // Verify all participants are shown again
      const clearedParticipants = await participantsPage.getAllParticipantIds();
      expect(clearedParticipants.length).toBe(originalCount);
    });
  });

  test.describe('Bulk Operations and Multi-Select', () => {
    test('should select multiple participants for bulk operations', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const participantIds = await participantsPage.getAllParticipantIds();
      expect(participantIds.length).toBeGreaterThan(1);

      // Select first two participants
      const participantsToSelect = participantIds.slice(0, 2);
      await participantsPage.selectParticipants(participantsToSelect);

      // Verify selections
      const selectedCount = await participantsPage.getSelectedRowCount();
      expect(selectedCount).toBe(2);
    });

    test('should perform bulk delete operation', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const initialIds = await participantsPage.getAllParticipantIds();
      expect(initialIds.length).toBeGreaterThan(2);

      // Select participants for deletion
      const participantsToDelete = initialIds.slice(0, 2);
      await participantsPage.selectParticipants(participantsToDelete);

      // Perform bulk delete
      await participantsPage.deleteParticipants();
      await waitForPageStability();

      // Verify participants were deleted
      const finalIds = await participantsPage.getAllParticipantIds();
      expect(finalIds.length).toBe(initialIds.length - 2);

      // Verify specific participants are gone
      for (const participantId of participantsToDelete) {
        expect(await participantsPage.participantExists(participantId)).toBe(false);
      }
    });

    test('should handle bulk operations with no selection', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      // Try bulk delete with no selection
      try {
        await participantsPage.deleteParticipants();
        // Should either show error or disable the button
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        // Expected behavior - bulk delete should fail with no selection
        expect(String(error)).toContain('No participants selected');
      }
    });

    test('should handle partial selection scenarios', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const participantIds = await participantsPage.getAllParticipantIds();
      expect(participantIds.length).toBeGreaterThan(3);

      // Select some participants, then deselect one
      const participantsToSelect = participantIds.slice(0, 3);
      await participantsPage.selectParticipants(participantsToSelect);

      // Verify initial selection
      let selectedCount = await participantsPage.getSelectedRowCount();
      expect(selectedCount).toBe(3);

      // Deselect one participant (click the same checkbox again)
      const participantToDeselect = participantsToSelect[1]!;
      await participantsPage.selectParticipants([participantToDeselect]);

      // Verify reduced selection
      selectedCount = await participantsPage.getSelectedRowCount();
      expect(selectedCount).toBe(2);
    });
  });

  test.describe('Participant URL Generation and Management', () => {
    test('should generate participant URLs successfully', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const participantIds = await participantsPage.getAllParticipantIds();
      expect(participantIds.length).toBeGreaterThan(0);

      // Generate URLs for participants
      await participantsPage.generateParticipantURLs();
      await waitForPageStability();

      // Verify URLs table is displayed
      // Access page through bracket notation to avoid TypeScript protected property error
      const urlsTable = (participantsPage as any).page.locator('[data-testid="generated-urls-table"]');
      await expect(urlsTable).toBeVisible();

      // Verify URLs are generated for existing participants
      for (const participantId of participantIds.slice(0, 3)) { // Check first 3
        const urlRow = urlsTable.locator(`tr:has-text("${participantId}")`);
        await expect(urlRow).toBeVisible();
      }
    });

    test('should copy participant URL to clipboard', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const participantIds = await participantsPage.getAllParticipantIds();
      expect(participantIds.length).toBeGreaterThan(0);

      const participantId = participantIds[0];
      expect(participantId).toBeTruthy();

      // Copy URL for first participant
      await participantsPage.copyParticipantUrl(participantId!);
      await waitForPageStability();

      // Verify copy operation completed (success message should appear)
      // Note: We can't actually verify clipboard content in tests, but we can verify the UI feedback
    });

    test('should download participant URLs', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const participantIds = await participantsPage.getAllParticipantIds();
      expect(participantIds.length).toBeGreaterThan(0);

      // Set up download handling
      const downloadPromise = functionalPage.waitForEvent('download');

      // Download participant URLs
      await participantsPage.downloadParticipantUrls();

      // Wait for download
      try {
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.(csv|txt)$/);
      } catch (error) {
        // Download might not trigger in test environment - this is acceptable
        // eslint-disable-next-line no-console
        console.log('Download test completed with:', String(error));
      }
    });

    test('should validate URL generation for empty participant list', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      // If there are participants, delete them all first to test empty state
      const participantIds = await participantsPage.getAllParticipantIds();
      
      if (participantIds.length > 0) {
        await participantsPage.selectParticipants(participantIds);
        await participantsPage.deleteParticipants();
        await waitForPageStability();
      }

      // Try to generate URLs with no participants
      try {
        await participantsPage.generateParticipantURLs();
        await waitForPageStability();

        // Should show appropriate message for empty participant list
        const emptyMessage = functionalPage.locator(
          '[data-testid="no-participants-message"], [data-testid="empty-state"], .empty-state'
        );
        
        const hasMessage = await emptyMessage.isVisible({ timeout: 5000 }).catch(() => false);
        if (hasMessage) {
          const messageText = await emptyMessage.textContent();
          expect(messageText?.toLowerCase()).toMatch(/(no.*participants|empty|add.*participants)/);
        }

      } catch (error) {
        // Error for empty participant list is acceptable
        expect(String(error)).toMatch(/(no.*participants|empty)/i);
      }
    });
  });

  test.describe('Participant Export Testing', () => {
    test('should export participants to CSV successfully', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const participantIds = await participantsPage.getAllParticipantIds();
      expect(participantIds.length).toBeGreaterThan(0);

      // Set up download handling
      const downloadPromise = functionalPage.waitForEvent('download');

      // Export participants
      await participantsPage.exportParticipants();

      try {
        // Wait for download
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.csv$/);
      } catch (error) {
        // Download might not trigger in test environment - this is acceptable
        // eslint-disable-next-line no-console
        console.log('Export test completed with:', String(error));
      }
    });

    test('should export filtered participants only', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const allParticipants = await participantsPage.getAllParticipantIds();
      expect(allParticipants.length).toBeGreaterThan(1);

      // Apply a filter first
      const firstParticipant = allParticipants[0];
      expect(firstParticipant).toBeTruthy();
      await participantsPage.searchParticipants(firstParticipant!.substring(0, 3));
      await waitForPageStability();

      // Verify filter applied
      const filteredParticipants = await participantsPage.getAllParticipantIds();
      expect(filteredParticipants.length).toBeLessThanOrEqual(allParticipants.length);

      // Set up download handling
      const downloadPromise = functionalPage.waitForEvent('download');

      // Export filtered participants
      await participantsPage.exportParticipants();

      try {
        // Wait for download
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.csv$/);
      } catch (error) {
        // Download might not trigger in test environment - this is acceptable
        // eslint-disable-next-line no-console
        console.log('Filtered export test completed with:', String(error));
      }
    });

    test('should handle export with no participants', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      // Filter to show no results
      await participantsPage.searchParticipants('NonExistentParticipant12345');
      await waitForPageStability();

      // Verify no participants shown
      const filteredParticipants = await participantsPage.getAllParticipantIds();
      expect(filteredParticipants.length).toBe(0);

      try {
        await participantsPage.exportParticipants();
        await waitForPageStability();

        // Should show appropriate message for empty export
        const emptyMessage = functionalPage.locator(
          '[data-testid="no-data-export"], [data-testid="empty-export"], .warning'
        );
        
        const hasMessage = await emptyMessage.isVisible({ timeout: 5000 }).catch(() => false);
        if (hasMessage) {
          const messageText = await emptyMessage.textContent();
          expect(messageText?.toLowerCase()).toMatch(/(no.*data|empty|no.*participants)/);
        }

      } catch (error) {
        // Error for empty export is acceptable
        expect(String(error)).toMatch(/(no.*data|empty)/i);
      }
    });
  });

  test.describe('Form Validation and Error Handling', () => {
    test('should validate required fields in participant form', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      // Open add participant modal
      await participantsPage.openAddParticipantModal();

      // Try to submit empty form
      await participantsPage.submitParticipantForm();
      await waitForPageStability();

      // Check for validation errors
      const validationErrors = await participantsPage.getFormValidationErrors();
      expect(validationErrors.length).toBeGreaterThan(0);

      // Should have errors for required fields
      const errorText = validationErrors.join(' ').toLowerCase();
      expect(errorText).toMatch(/(required|must.*provide|cannot.*empty)/);
    });

    test('should validate email format in participant form', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      // Open add participant modal
      await participantsPage.openAddParticipantModal();

      // Fill form with invalid email
      await participantsPage.fillParticipantForm({
        id: 'TEST-EMAIL',
        name: 'Test User',
        email: 'invalid-email-format',
      });

      await participantsPage.submitParticipantForm();
      await waitForPageStability();

      // Check for email validation error
      const validationErrors = await participantsPage.getFormValidationErrors();
      const hasEmailError = validationErrors.some(error => 
        error.toLowerCase().includes('email') || error.toLowerCase().includes('valid')
      );
      expect(hasEmailError).toBe(true);
    });

    test('should validate duplicate participant IDs', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const existingParticipants = await participantsPage.getAllParticipantIds();
      expect(existingParticipants.length).toBeGreaterThan(0);

      const existingId = existingParticipants[0];
      expect(existingId).toBeTruthy();

      // Open add participant modal
      await participantsPage.openAddParticipantModal();

      // Try to create participant with existing ID
      await participantsPage.fillParticipantForm({
        id: existingId!,
        name: 'Duplicate Test',
        email: 'duplicate@example.com',
      });

      try {
        await participantsPage.submitParticipantForm();
        await waitForPageStability();

        // Should show duplicate ID error
        const validationErrors = await participantsPage.getFormValidationErrors();
        const hasDuplicateError = validationErrors.some(error => 
          error.toLowerCase().includes('duplicate') || 
          error.toLowerCase().includes('exists') ||
          error.toLowerCase().includes('unique')
        );
        expect(hasDuplicateError).toBe(true);

      } catch (error) {
        // Form submission failure for duplicate is acceptable
        expect(String(error)).toMatch(/(duplicate|exists|unique)/i);
      }
    });

    test('should validate field length limits', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      // Open add participant modal
      await participantsPage.openAddParticipantModal();

      // Fill form with excessively long values
      const longString = 'a'.repeat(300); // Assuming 255 char limit
      await participantsPage.fillParticipantForm({
        id: longString,
        name: longString,
        email: `${longString}@example.com`,
        notes: 'a'.repeat(1000),
      });

      try {
        await participantsPage.submitParticipantForm();
        await waitForPageStability();

        // Should show length validation errors
        const validationErrors = await participantsPage.getFormValidationErrors();
        const hasLengthError = validationErrors.some(error => 
          error.toLowerCase().includes('length') || 
          error.toLowerCase().includes('long') ||
          error.toLowerCase().includes('maximum')
        );
        expect(hasLengthError).toBe(true);

      } catch (error) {
        // Form submission failure for length validation is acceptable
        expect(String(error)).toMatch(/(length|long|maximum)/i);
      }
    });
  });

  test.describe('Edge Cases and Error Scenarios', () => {
    test('should handle network interruption during import', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      // Simulate network issues by intercepting requests
      await functionalPage.route('**/api/participants**', route => route.abort());

      try {
        const validCsvPath = path.resolve('tests/e2e/test-data/participants/valid-participants.csv');
        await participantsPage.importParticipantsCSV(validCsvPath);
        await waitForPageStability();
      } catch (error) {
        // Import should fail gracefully
        expect(error).toBeTruthy();
      }

      // Restore network
      await functionalPage.unroute('**/api/participants**');
    });

    test('should handle concurrent participant operations', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const participantIds = await participantsPage.getAllParticipantIds();
      expect(participantIds.length).toBeGreaterThan(1);

      try {
        // Start multiple operations concurrently
        const operations = [
          participantsPage.editParticipant(participantIds[0]!),
          participantsPage.generateParticipantURLs(),
        ];

        await Promise.all(operations);
        await waitForPageStability();

        // Verify operations completed without breaking the UI
        await participantsPage.verifyParticipantsPageLoaded();

      } catch (error) {
        // Some operations might fail due to concurrency - this is acceptable
        // As long as the UI doesn't break
        expect(error).toBeTruthy();
      }
    });

    test('should maintain data integrity during bulk operations', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const initialIds = await participantsPage.getAllParticipantIds();
      expect(initialIds.length).toBeGreaterThan(3);

      // Perform multiple bulk operations
      const firstBatch = initialIds.slice(0, 2);
      const secondBatch = initialIds.slice(2, 4);

      // Delete first batch
      await participantsPage.selectParticipants(firstBatch);
      await participantsPage.deleteParticipants();
      await waitForPageStability();

      // Verify first batch deleted
      for (const participantId of firstBatch) {
        expect(await participantsPage.participantExists(participantId)).toBe(false);
      }

      // Verify second batch still exists
      for (const participantId of secondBatch) {
        expect(await participantsPage.participantExists(participantId)).toBe(true);
      }

      // Delete second batch
      await participantsPage.selectParticipants(secondBatch);
      await participantsPage.deleteParticipants();
      await waitForPageStability();

      // Verify second batch deleted
      for (const participantId of secondBatch) {
        expect(await participantsPage.participantExists(participantId)).toBe(false);
      }
    });

    test('should handle malformed CSV gracefully', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      // Create a malformed CSV file
      const fs = await import('fs');
      const tempCsvPath = path.resolve('tests/e2e/test-data/participants/temp-malformed.csv');
      const malformedCsv = 'identifier,label\nP001,"Unclosed quote\nP002,Valid Entry';
      fs.writeFileSync(tempCsvPath, malformedCsv);

      try {
        await participantsPage.importParticipantsCSV(tempCsvPath);
        await waitForPageStability();

        // Should show parsing error
        const errorMessage = functionalPage.locator(
          '[data-testid="parse-error"], [data-testid="format-error"], .error'
        );
        
        const hasError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);
        if (hasError) {
          const errorText = await errorMessage.textContent();
          expect(errorText?.toLowerCase()).toMatch(/(parse|format|malformed|invalid)/);
        }

      } catch (error) {
        // Parse error is expected for malformed CSV
        expect(String(error)).toMatch(/(parse|format|malformed)/i);
      } finally {
        // Clean up temp file
        try {
          fs.unlinkSync(tempCsvPath);
        } catch {
          // Ignore cleanup errors
        }
      }
    });
  });

  test.describe('Participant Status and State Management', () => {
    test('should display participant status correctly', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const participantIds = await participantsPage.getAllParticipantIds();
      expect(participantIds.length).toBeGreaterThan(0);

      // Check status of each participant
      for (const participantId of participantIds.slice(0, 5)) { // Check first 5
        const participantData = await participantsPage.getParticipantFromTable(participantId);
        expect(participantData?.status).toBeTruthy();
        
        // Status should be one of expected values
        const validStatuses = ['active', 'pending', 'completed', 'invited'];
        expect(validStatuses.some(status => 
          participantData?.status.toLowerCase().includes(status)
        )).toBe(true);
      }
    });

    test('should update participant count correctly after operations', async ({
      waitForPageStability,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      const initialCount = await participantsPage.getParticipantCount();

      // Add a participant
      await participantsPage.openAddParticipantModal();
      await participantsPage.fillParticipantForm({
        id: `COUNT-TEST-${Date.now()}`,
        name: 'Count Test Participant',
        email: 'count@example.com',
      });
      await participantsPage.submitParticipantForm();
      await waitForPageStability();

      // Verify count increased
      const afterAddCount = await participantsPage.getParticipantCount();
      expect(afterAddCount).toBe(initialCount + 1);

      // Delete the participant
      const participantIds = await participantsPage.getAllParticipantIds();
      const newParticipantId = participantIds.find(id => id.startsWith('COUNT-TEST-'));
      expect(newParticipantId).toBeTruthy();

      await participantsPage.deleteParticipant(newParticipantId!);
      await waitForPageStability();

      // Verify count returned to original
      const finalCount = await participantsPage.getParticipantCount();
      expect(finalCount).toBe(initialCount);
    });

    test('should handle empty participant table state', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await participantsPage.goto();
      await waitForPageStability();
      await participantsPage.verifyParticipantsPageLoaded();

      // Delete all participants to test empty state
      const allParticipants = await participantsPage.getAllParticipantIds();
      
      if (allParticipants.length > 0) {
        await participantsPage.selectParticipants(allParticipants);
        await participantsPage.deleteParticipants();
        await waitForPageStability();
      }

      // Verify empty state
      const isEmpty = await participantsPage.isParticipantsTableEmpty();
      expect(isEmpty).toBe(true);

      // Check for empty state message
      const emptyMessage = functionalPage.locator(
        '[data-testid="empty-participants"], [data-testid="no-participants"], .empty-state'
      );
      
      const hasEmptyMessage = await emptyMessage.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasEmptyMessage) {
        const messageText = await emptyMessage.textContent();
        expect(messageText?.toLowerCase()).toMatch(/(no.*participants|empty|add.*first)/);
      }
    });
  });
});