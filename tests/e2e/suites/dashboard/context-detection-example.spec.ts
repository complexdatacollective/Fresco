import { expect, test } from '../../fixtures/test';

/**
 * Example test demonstrating automatic context detection
 * This test will run in the dashboard context because:
 * 1. It's in /suites/dashboard/ directory
 * 2. It's running with the dashboard Playwright project
 * 3. It has the DASHBOARD_URL as baseURL
 */

test.describe('Context Detection Examples', () => {
  test('should automatically detect dashboard context', async ({
    database,
  }) => {
    // Get information about the detected context
    const contextInfo = database.getContextInfo();

    // eslint-disable-next-line no-console
    console.log('Context detection info:', contextInfo);

    // Verify we're using the dashboard context
    expect(contextInfo.resolvedContext).toBe('dashboard');
    expect(contextInfo.availableContexts).toContain('dashboard');

    // Verify detection method worked
    const possibleMethods = [
      'test file path',
      'Playwright project name',
      'base URL matching',
    ];
    expect(possibleMethods).toContain(contextInfo.detectionMethod);
  });

  test('should have appropriate test data for dashboard context', async ({
    database,
  }) => {
    // Dashboard context should have basic test data
    const participants = await database.prisma.participant.findMany();
    const protocols = await database.prisma.protocol.findMany();

    // Dashboard context has basic setup but not the full interview data
    expect(participants.length).toBeGreaterThanOrEqual(0);
    expect(protocols.length).toBeGreaterThan(0);
  });

  test('should be able to work with dashboard-specific operations', async ({
    database,
  }) => {
    const cleanup = await database.isolate('dashboard-operations');

    // Test dashboard-specific data operations
    const newProtocol = await database.prisma.protocol.create({
      data: {
        name: 'Test Dashboard Protocol',
        hash: 'test-hash-dashboard',
        schemaVersion: 8,
        stages: [],
        codebook: {},
        experiments: {},
      },
    });

    expect(newProtocol.name).toBe('Test Dashboard Protocol');

    // Verify we can query the created protocol
    const found = await database.prisma.protocol.findUnique({
      where: { id: newProtocol.id },
    });
    expect(found).toBeTruthy();

    // Cleanup will restore to the original state
    await cleanup();

    // Verify the test protocol was removed
    const afterCleanup = await database.prisma.protocol.findUnique({
      where: { id: newProtocol.id },
    });
    expect(afterCleanup).toBeNull();
  });

  test('should show context info in error messages', async ({ database }) => {
    try {
      // This should work fine, but let's demonstrate what happens on context resolution failure
      const contextInfo = database.getContextInfo();

      expect(contextInfo).toMatchObject({
        resolvedContext: 'dashboard',
        availableContexts: expect.arrayContaining(['dashboard']),
        detectionMethod: expect.any(String),
        testFile: expect.stringContaining('/dashboard/'),
        projectName: 'dashboard',
      });
    } catch (error) {
      // If context resolution failed, the error should be informative
      expect(error.message).toContain('Available contexts:');
      expect(error.message).toContain('Test file:');
      expect(error.message).toContain('Project:');
    }
  });

  test('should demonstrate context-specific functionality', async ({
    database,
    page,
  }) => {
    // Since we're in dashboard context, we should be able to access admin features
    await page.goto('/dashboard');

    // The database should have admin user and protocol ready
    const adminUser = await database.prisma.user.findFirst();
    const protocols = await database.prisma.protocol.findMany();

    expect(adminUser).toBeTruthy();
    expect(protocols.length).toBeGreaterThan(0);

    // Verify we can see the dashboard page elements
    await expect(page.locator('h1, h2, [role="heading"]')).toBeVisible();
  });
});
