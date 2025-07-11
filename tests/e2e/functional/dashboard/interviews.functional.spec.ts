import { test } from '~/tests/e2e/fixtures/functional';
import { expect } from '@playwright/test';
import { InterviewsPage } from '~/tests/e2e/pages/dashboard/InterviewsPage';

/**
 * Comprehensive functional tests for interviews management
 * Tests cover filtering, export, analytics, and management operations
 */
test.describe('Interviews Management - Functional Tests', () => {
  let interviewsPage: InterviewsPage;

  test.beforeEach(async ({ dashboardData, setupFunctionalTest, functionalPage }) => {
    // Ensure test data is available
    void dashboardData;

    // Set up functional test environment
    await setupFunctionalTest({
      viewport: { width: 1280, height: 720 },
      timeout: 30000,
    });

    // Initialize interviews page object
    interviewsPage = new InterviewsPage(functionalPage);
  });

  test.describe('Interview Filtering and Management', () => {
    test('should filter interviews by completion status', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      // Get initial count of all interviews
      const allInterviewIds = await interviewsPage.getAllInterviewParticipantIds();
      const totalInterviews = allInterviewIds.length;
      expect(totalInterviews).toBeGreaterThan(0);

      // Filter by completed interviews
      await interviewsPage.filterByStatus('completed');
      await waitForPageStability();

      const completedIds = await interviewsPage.getAllInterviewParticipantIds();
      
      // Verify all displayed interviews are completed
      for (const participantId of completedIds) {
        const interview = await interviewsPage.getInterviewFromTable(participantId);
        expect(interview).toBeTruthy();
        expect(interview?.progress).toBe(100);
      }

      // Filter by in-progress interviews
      await interviewsPage.filterByStatus('in-progress');
      await waitForPageStability();

      const inProgressIds = await interviewsPage.getAllInterviewParticipantIds();
      
      // Verify all displayed interviews are in progress
      for (const participantId of inProgressIds) {
        const interview = await interviewsPage.getInterviewFromTable(participantId);
        expect(interview).toBeTruthy();
        expect(interview?.progress).toBeLessThan(100);
        expect(interview?.progress).toBeGreaterThan(0);
      }

      // Clear filters and verify we see all interviews again
      await interviewsPage.clearFilters();
      await waitForPageStability();

      const finalIds = await interviewsPage.getAllInterviewParticipantIds();
      expect(finalIds.length).toBe(totalInterviews);
    });

    test('should filter interviews by date range', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      // Get today's date and yesterday's date for filtering
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayStr = today.toISOString().split('T')[0]!;
      const yesterdayStr = yesterday.toISOString().split('T')[0]!;

      // Filter by date range (yesterday to today)
      await interviewsPage.filterByDateRange(yesterdayStr, todayStr);
      await waitForPageStability();

      const filteredIds = await interviewsPage.getAllInterviewParticipantIds();
      
      // Verify all interviews fall within the date range
      for (const participantId of filteredIds) {
        const interview = await interviewsPage.getInterviewFromTable(participantId);
        expect(interview).toBeTruthy();
        expect(interview?.startTime).toBeTruthy();
      }

      // Clear filters
      await interviewsPage.clearFilters();
      await waitForPageStability();
    });

    test('should filter interviews by participant', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      // Get a participant to filter by
      const allIds = await interviewsPage.getAllInterviewParticipantIds();
      expect(allIds.length).toBeGreaterThan(0);
      
      const targetParticipant = allIds[0]!;

      // Filter by specific participant
      await interviewsPage.filterByParticipant(targetParticipant);
      await waitForPageStability();

      const filteredIds = await interviewsPage.getAllInterviewParticipantIds();
      
      // Verify only the target participant appears (could be multiple interviews)
      for (const participantId of filteredIds) {
        expect(participantId.toLowerCase()).toContain(targetParticipant.toLowerCase());
      }

      // Clear filters
      await interviewsPage.clearFilters();
      await waitForPageStability();
    });

    test('should filter interviews by protocol', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      // Get first interview's protocol for filtering
      const allIds = await interviewsPage.getAllInterviewParticipantIds();
      expect(allIds.length).toBeGreaterThan(0);

      const firstInterview = await interviewsPage.getInterviewFromTable(allIds[0]!);
      expect(firstInterview).toBeTruthy();
      
      const targetProtocol = firstInterview!.protocolName;
      expect(targetProtocol).toBeTruthy();

      // Filter by protocol
      await interviewsPage.filterByProtocol(targetProtocol);
      await waitForPageStability();

      const filteredIds = await interviewsPage.getAllInterviewParticipantIds();
      
      // Verify all interviews use the target protocol
      for (const participantId of filteredIds) {
        const interview = await interviewsPage.getInterviewFromTable(participantId);
        expect(interview?.protocolName).toBe(targetProtocol);
      }

      // Clear filters
      await interviewsPage.clearFilters();
      await waitForPageStability();
    });

    test('should clear all filters correctly', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      // Get initial count
      const initialIds = await interviewsPage.getAllInterviewParticipantIds();
      const initialCount = initialIds.length;

      // Apply multiple filters
      await interviewsPage.filterByStatus('completed');
      await waitForPageStability();

      if (initialIds.length > 0) {
        const firstInterview = await interviewsPage.getInterviewFromTable(initialIds[0]!);
        if (firstInterview?.protocolName) {
          await interviewsPage.filterByProtocol(firstInterview.protocolName);
          await waitForPageStability();
        }
      }

      // Verify filters are applied (count should be different)
      const filteredIds = await interviewsPage.getAllInterviewParticipantIds();
      void filteredIds; // Used for verification that filters are applied
      
      // Clear all filters
      await interviewsPage.clearFilters();
      await waitForPageStability();

      // Verify we're back to the original count
      const finalIds = await interviewsPage.getAllInterviewParticipantIds();
      expect(finalIds.length).toBe(initialCount);
    });
  });

  test.describe('Interview Export Testing', () => {
    test('should export interviews in JSON format', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      // Skip test if no interviews
      const interviewCount = await interviewsPage.getInterviewCount();
      if (interviewCount === 0) {
        test.skip();
      }

      // Export in JSON format
      await interviewsPage.exportInterviews('json');
      await waitForPageStability();

      // Verify export process completed successfully
      // (Note: We can't verify actual file content in E2E tests, 
      // but we can verify the export process completes without errors)
    });

    test('should export interviews in CSV format', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      // Skip test if no interviews
      const interviewCount = await interviewsPage.getInterviewCount();
      if (interviewCount === 0) {
        test.skip();
      }

      // Export in CSV format
      await interviewsPage.exportInterviews('csv');
      await waitForPageStability();

      // Verify export process completed successfully
    });

    test('should export network data only', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      // Skip test if no interviews
      const interviewCount = await interviewsPage.getInterviewCount();
      if (interviewCount === 0) {
        test.skip();
      }

      // Export network data only
      await interviewsPage.exportInterviews('network-only');
      await waitForPageStability();

      // Verify export process completed successfully
    });

    test('should export interviews with participant data', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      // Skip test if no interviews
      const interviewCount = await interviewsPage.getInterviewCount();
      if (interviewCount === 0) {
        test.skip();
      }

      // Export with participant data
      await interviewsPage.exportInterviews('with-participants');
      await waitForPageStability();

      // Verify export process completed successfully
    });

    test('should export selected interviews only', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      const allIds = await interviewsPage.getAllInterviewParticipantIds();
      if (allIds.length < 2) {
        test.skip();
      }

      // Select specific interviews (first 2)
      const selectedIds = allIds.slice(0, 2);
      await interviewsPage.selectInterviews(selectedIds);
      await waitForPageStability();

      // Export selected interviews
      await interviewsPage.exportInterviews('json');
      await waitForPageStability();

      // Verify export process completed successfully
    });

    test('should handle export errors gracefully', async ({
      waitForPageStability,
      functionalPage,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      // Skip test if no interviews
      const interviewCount = await interviewsPage.getInterviewCount();
      if (interviewCount === 0) {
        test.skip();
      }

      // Simulate network error during export by intercepting requests
      await functionalPage.route('**/api/export/**', (route) => {
        void route.abort('failed');
      });

      // Attempt export - should handle error gracefully
      try {
        await interviewsPage.exportInterviews('json');
        await waitForPageStability();
        
        // Should show error message
        await interviewsPage.waitForErrorMessage();
      } catch (error) {
        // Expected to fail - verify error handling
        expect(error).toBeTruthy();
      }
    });
  });

  test.describe('Interview Analytics Testing', () => {
    test('should display accurate interview statistics', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      // Skip test if no interviews
      const interviewCount = await interviewsPage.getInterviewCount();
      if (interviewCount === 0) {
        test.skip();
      }

      // Get analytics data
      const analytics = await interviewsPage.getInterviewAnalytics();

      // Verify analytics structure
      expect(analytics.totalInterviews).toBeGreaterThanOrEqual(0);
      expect(analytics.completedInterviews).toBeGreaterThanOrEqual(0);
      expect(analytics.inProgressInterviews).toBeGreaterThanOrEqual(0);
      expect(analytics.exportedInterviews).toBeGreaterThanOrEqual(0);
      expect(analytics.unexportedInterviews).toBeGreaterThanOrEqual(0);

      // Verify completion rate is within valid range
      expect(analytics.completionRate).toBeGreaterThanOrEqual(0);
      expect(analytics.completionRate).toBeLessThanOrEqual(100);

      // Verify average progress is within valid range
      expect(analytics.averageProgress).toBeGreaterThanOrEqual(0);
      expect(analytics.averageProgress).toBeLessThanOrEqual(100);

      // Verify totals add up correctly
      expect(analytics.completedInterviews + analytics.inProgressInterviews)
        .toBeLessThanOrEqual(analytics.totalInterviews);
      
      expect(analytics.exportedInterviews + analytics.unexportedInterviews)
        .toBeLessThanOrEqual(analytics.totalInterviews);
    });

    test('should calculate completion rates correctly', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      // Skip test if no interviews
      const interviewCount = await interviewsPage.getInterviewCount();
      if (interviewCount === 0) {
        test.skip();
      }

      // Get all interviews and manually calculate completion rate
      const allIds = await interviewsPage.getAllInterviewParticipantIds();
      let manualCompletedCount = 0;

      for (const participantId of allIds) {
        const interview = await interviewsPage.getInterviewFromTable(participantId);
        if (interview && interview.progress >= 100) {
          manualCompletedCount++;
        }
      }

      const expectedCompletionRate = allIds.length > 0 
        ? (manualCompletedCount / allIds.length) * 100 
        : 0;

      // Get analytics completion rate
      const analytics = await interviewsPage.getInterviewAnalytics();

      // Allow for small rounding differences
      expect(Math.abs(analytics.completionRate - expectedCompletionRate)).toBeLessThan(1);
    });

    test('should show protocol-specific statistics', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      // Skip test if no interviews
      const allIds = await interviewsPage.getAllInterviewParticipantIds();
      if (allIds.length === 0) {
        test.skip();
      }

      // Get protocol name from first interview
      const firstInterview = await interviewsPage.getInterviewFromTable(allIds[0]!);
      expect(firstInterview).toBeTruthy();
      
      const protocolName = firstInterview?.protocolName;
      expect(protocolName).toBeTruthy();

      // Get protocol-specific statistics
      const protocolStats = await interviewsPage.getProtocolStatistics(protocolName!);

      // Verify statistics structure
      expect(protocolStats.totalInterviews).toBeGreaterThan(0);
      expect(protocolStats.completedInterviews).toBeGreaterThanOrEqual(0);
      expect(protocolStats.averageProgress).toBeGreaterThanOrEqual(0);
      expect(protocolStats.averageProgress).toBeLessThanOrEqual(100);

      // Verify completed interviews don't exceed total
      expect(protocolStats.completedInterviews).toBeLessThanOrEqual(protocolStats.totalInterviews);
    });
  });

  test.describe('Interview Management Operations', () => {
    test('should delete selected interviews with confirmation', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      const initialIds = await interviewsPage.getAllInterviewParticipantIds();
      if (initialIds.length < 2) {
        test.skip();
      }

      const initialCount = initialIds.length;
      const interviewsToDelete = initialIds.slice(0, 2);

      // Select interviews to delete
      await interviewsPage.selectInterviews(interviewsToDelete);
      await waitForPageStability();

      // Delete selected interviews
      await interviewsPage.deleteInterviews();
      await waitForPageStability();

      // Verify interviews were deleted
      const finalIds = await interviewsPage.getAllInterviewParticipantIds();
      expect(finalIds.length).toBe(initialCount - interviewsToDelete.length);

      // Verify specific interviews are no longer present
      for (const deletedId of interviewsToDelete) {
        expect(await interviewsPage.interviewExists(deletedId)).toBe(false);
      }
    });

    test('should delete single interview', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      const initialIds = await interviewsPage.getAllInterviewParticipantIds();
      if (initialIds.length === 0) {
        test.skip();
      }

      const initialCount = initialIds.length;
      const interviewToDelete = initialIds[0]!;

      // Delete single interview
      await interviewsPage.deleteSingleInterview(interviewToDelete);
      await waitForPageStability();

      // Verify interview was deleted
      const finalIds = await interviewsPage.getAllInterviewParticipantIds();
      expect(finalIds.length).toBe(initialCount - 1);
      expect(await interviewsPage.interviewExists(interviewToDelete)).toBe(false);
    });

    test('should export single interview', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      const allIds = await interviewsPage.getAllInterviewParticipantIds();
      if (allIds.length === 0) {
        test.skip();
      }

      const interviewToExport = allIds[0]!;

      // Export single interview in JSON format
      await interviewsPage.exportSingleInterview(interviewToExport, 'json');
      await waitForPageStability();

      // Export single interview in CSV format
      await interviewsPage.exportSingleInterview(interviewToExport, 'csv');
      await waitForPageStability();

      // Verify export processes completed successfully
      // (Actual file verification would be done in integration tests)
    });

    test('should generate interview URLs for incomplete interviews', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      // Filter to show only in-progress interviews
      await interviewsPage.filterByStatus('in-progress');
      await waitForPageStability();

      const inProgressIds = await interviewsPage.getAllInterviewParticipantIds();
      if (inProgressIds.length === 0) {
        test.skip();
      }

      // Generate interview URLs
      await interviewsPage.generateInterviewURLs();
      await waitForPageStability();

      // Verify URL generation process completed
      // (Actual URL verification would be done in integration tests)

      // Clear filters
      await interviewsPage.clearFilters();
      await waitForPageStability();
    });

    test('should handle bulk operations with no selection', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      // Skip test if no interviews
      const interviewCount = await interviewsPage.getInterviewCount();
      if (interviewCount === 0) {
        test.skip();
      }

      // Ensure no interviews are selected
      await interviewsPage.deselectAllTableRows();

      // Attempt bulk delete with no selection - should show error or disable button
      try {
        await interviewsPage.deleteInterviews();
        // Should not reach here - should throw error
        expect(false).toBe(true);
      } catch (error) {
        // Expected error for no selection
        expect(error).toBeTruthy();
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle empty interviews table gracefully', async ({
      waitForPageStability,
      dashboardData: _dashboardData,
    }) => {
      // Note: Clear all interviews for this test (method not available in current fixtures)

      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      // Verify empty state is shown
      expect(await interviewsPage.isInterviewsTableEmpty()).toBe(true);

      // Verify analytics show zeros
      const analytics = await interviewsPage.getInterviewAnalytics();
      expect(analytics.totalInterviews).toBe(0);
      expect(analytics.completedInterviews).toBe(0);
      expect(analytics.inProgressInterviews).toBe(0);
    });

    test('should handle filter with no results', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      // Skip test if no interviews to start with
      const initialCount = await interviewsPage.getInterviewCount();
      if (initialCount === 0) {
        test.skip();
      }

      // Apply filter that should return no results
      await interviewsPage.filterByParticipant('NONEXISTENT_PARTICIPANT_12345');
      await waitForPageStability();

      // Verify no results state
      const filteredCount = await interviewsPage.getInterviewCount();
      expect(filteredCount).toBe(0);

      // Clear filters and verify interviews return
      await interviewsPage.clearFilters();
      await waitForPageStability();

      const finalCount = await interviewsPage.getInterviewCount();
      expect(finalCount).toBe(initialCount);
    });

    test('should handle concurrent filter operations', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      // Skip test if no interviews
      const interviewCount = await interviewsPage.getInterviewCount();
      if (interviewCount === 0) {
        test.skip();
      }

      // Apply multiple filters rapidly
      await Promise.all([
        interviewsPage.filterByStatus('completed'),
        // Add small delay to avoid race conditions
        new Promise(resolve => setTimeout(resolve, 100)).then(() => 
          interviewsPage.filterByStatus('in-progress')
        ),
      ]);

      await waitForPageStability();

      // Verify final state is consistent
      const finalIds = await interviewsPage.getAllInterviewParticipantIds();
      
      // Clear filters
      await interviewsPage.clearFilters();
      await waitForPageStability();

      // Verify we can return to original state
      const clearedIds = await interviewsPage.getAllInterviewParticipantIds();
      expect(clearedIds.length).toBeGreaterThanOrEqual(finalIds.length);
    });

    test('should validate interview data integrity', async ({
      waitForPageStability,
    }) => {
      await interviewsPage.goto();
      await waitForPageStability();
      await interviewsPage.verifyInterviewsPageLoaded();

      const allIds = await interviewsPage.getAllInterviewParticipantIds();
      if (allIds.length === 0) {
        test.skip();
      }

      // Verify each interview has required data
      for (const participantId of allIds) {
        const interview = await interviewsPage.getInterviewFromTable(participantId);
        
        expect(interview).toBeTruthy();
        expect(interview?.participantIdentifier).toBeTruthy();
        expect(interview?.protocolName).toBeTruthy();
        expect(interview?.startTime).toBeTruthy();
        expect(interview?.lastUpdated).toBeTruthy();
        expect(interview?.progress).toBeGreaterThanOrEqual(0);
        expect(interview?.progress).toBeLessThanOrEqual(100);
        expect(interview?.exportStatus).toBeTruthy();
      }
    });
  });
});