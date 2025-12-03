import { expect, SNAPSHOT_CONFIGS, test } from '../../fixtures/test';

/**
 * Example test file demonstrating database snapshot functionality
 * This shows how to use the integrated database fixture for test isolation
 */

test.describe('Participants Database Operations - Example', () => {
  // Parallel tests that don't modify database
  test.describe.parallel('Read Operations', () => {
    test('should count initial participants', async ({ database }) => {
      const count = await database.prisma.participant.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should find specific participants', async ({ database }) => {
      const participants = await database.prisma.participant.findMany({
        where: { identifier: { startsWith: 'P0' } },
        take: 5,
      });
      expect(participants.length).toBeGreaterThan(0);
    });
  });

  // Serial tests that modify database with isolation
  test.describe.serial('Write Operations with Database Isolation', () => {
    test('should add participant with automatic cleanup', async ({
      database,
    }) => {
      const cleanup = await database.isolate('add-participant-test');

      // Add a new participant
      const newParticipant = await database.prisma.participant.create({
        data: {
          identifier: 'TEST001',
          label: 'Test Participant 1',
        },
      });

      expect(newParticipant.identifier).toBe('TEST001');

      // Verify the participant exists
      const found = await database.prisma.participant.findUnique({
        where: { id: newParticipant.id },
      });
      expect(found).toBeTruthy();

      // Cleanup - restores to state before test
      await cleanup();

      // Verify participant was removed
      const afterCleanup = await database.prisma.participant.findUnique({
        where: { id: newParticipant.id },
      });
      expect(afterCleanup).toBeNull();
    });

    test('should delete participants with automatic cleanup', async ({
      database,
    }) => {
      const cleanup = await database.isolate('delete-participants-test');

      // Get initial count
      const initialCount = await database.prisma.participant.count();

      // Delete all participants
      await database.prisma.participant.deleteMany();

      // Verify deletion
      const afterDelete = await database.prisma.participant.count();
      expect(afterDelete).toBe(0);

      // Cleanup - restores all participants
      await cleanup();

      // Verify restoration
      const afterRestore = await database.prisma.participant.count();
      expect(afterRestore).toBe(initialCount);
    });

    test('should use scoped operations', async ({ database }) => {
      const initialCount = await database.prisma.participant.count();

      const scopedCount = await database.withSnapshot(
        'scoped-operations',
        async () => {
          // Create some temporary participants
          await database.prisma.participant.createMany({
            data: [
              { identifier: 'SCOPE001', label: 'Scoped Participant 1' },
              { identifier: 'SCOPE002', label: 'Scoped Participant 2' },
            ],
          });

          return await database.prisma.participant.count();
        },
      );

      // Inside the scope, we had more participants
      expect(scopedCount).toBe(initialCount + 2);

      // After the scope, we're back to the original count
      const finalCount = await database.prisma.participant.count();
      expect(finalCount).toBe(initialCount);
    });

    test('should handle complex database state changes', async ({
      database,
    }) => {
      const cleanup = await database.isolate('complex-changes-test');

      // Create multiple snapshots for complex workflow
      await database.create('step1-start');

      // Step 1: Add a participant
      const participant1 = await database.prisma.participant.create({
        data: { identifier: 'COMPLEX001', label: 'Complex Test 1' },
      });

      await database.create('step1-complete');

      // Step 2: Add another participant
      const participant2 = await database.prisma.participant.create({
        data: { identifier: 'COMPLEX002', label: 'Complex Test 2' },
      });

      await database.create('step2-complete');

      // Test: Can rollback to step 1
      await database.restore('step1-complete');

      const afterRollback1 = await database.prisma.participant.findUnique({
        where: { id: participant1.id },
      });
      const afterRollback2 = await database.prisma.participant.findUnique({
        where: { id: participant2.id },
      });

      expect(afterRollback1).toBeTruthy();
      expect(afterRollback2).toBeNull();

      // Test: Can rollback to beginning
      await database.restore('step1-start');

      const afterFullRollback1 = await database.prisma.participant.findUnique({
        where: { id: participant1.id },
      });
      const afterFullRollback2 = await database.prisma.participant.findUnique({
        where: { id: participant2.id },
      });

      expect(afterFullRollback1).toBeNull();
      expect(afterFullRollback2).toBeNull();

      // Cleanup to original state
      await cleanup();
    });
  });

  test.describe.serial('Integration with Visual Testing', () => {
    test('should combine database and visual snapshots', async ({
      page,
      database,
      snapshots,
    }) => {
      const cleanup = await database.isolate('visual-integration-test');

      // Set up specific database state for visual test
      await database.prisma.participant.deleteMany();
      await database.prisma.participant.create({
        data: {
          identifier: 'VIS001',
          label: 'Visual Test User',
        },
      });

      // Navigate to page and wait for stability
      await page.goto('/dashboard/participants');
      await snapshots.waitForStablePage();

      // Take visual snapshot of the single participant state
      await snapshots.expectPageToMatchSnapshot(
        SNAPSHOT_CONFIGS.table('single-participant-state'),
      );

      // Cleanup database
      await cleanup();

      // Verify we're back to full participant list
      const finalCount = await database.prisma.participant.count();
      expect(finalCount).toBeGreaterThan(1);
    });
  });
});
