import { expect, test } from '~/tests/e2e/fixtures';

test.describe('Database Seeding Tests', () => {
  test('should seed basic data correctly', async ({ basicData, db }) => {
    // Verify user was created
    expect(basicData.user).toBeDefined();
    expect(basicData.user.username).toBe('testuser');

    // Verify protocols were created
    expect(basicData.protocols).toHaveLength(2);
    expect(basicData.protocols[0].name).toBe('Test Protocol 1');

    // Verify participants were created
    expect(basicData.participants).toHaveLength(5);

    // Verify interviews were created
    expect(basicData.interviews).toHaveLength(5);

    // Verify data exists in database
    const userCount = await db.user.count();
    expect(userCount).toBe(1);

    const protocolCount = await db.protocol.count();
    expect(protocolCount).toBe(2);

    const participantCount = await db.participant.count();
    expect(participantCount).toBe(5);

    const interviewCount = await db.interview.count();
    expect(interviewCount).toBe(5);
  });

  test('should seed dashboard data correctly', async ({
    dashboardData,
    db,
  }) => {
    // Verify comprehensive data was created
    expect(dashboardData.user.username).toBe('admin');
    expect(dashboardData.protocols.length).toBeGreaterThan(5);
    expect(dashboardData.participants).toHaveLength(50);
    expect(dashboardData.interviews.length).toBeGreaterThan(20);

    // Verify some interviews are finished
    const finishedInterviews = await db.interview.count({
      where: { finishTime: { not: null } },
    });
    expect(finishedInterviews).toBeGreaterThan(0);
  });

  test('should handle clean database fixture', async ({
    cleanDatabase,
    db,
  }) => {
    await cleanDatabase();

    // Database should be clean
    const userCount = await db.user.count();
    const protocolCount = await db.protocol.count();
    const participantCount = await db.participant.count();
    const interviewCount = await db.interview.count();

    expect(userCount).toBe(0);
    expect(protocolCount).toBe(0);
    expect(participantCount).toBe(0);
    expect(interviewCount).toBe(0);

    // App settings should still exist
    const settingsCount = await db.appSettings.count();
    expect(settingsCount).toBeGreaterThan(0);
  });

  test('should isolate tests from each other', async ({
    basicData: _basicData,
    db,
  }) => {
    // This test should have fresh basicData, not affected by previous tests
    const protocolCount = await db.protocol.count();
    expect(protocolCount).toBe(2); // Only the protocols from basicData
  });
});
