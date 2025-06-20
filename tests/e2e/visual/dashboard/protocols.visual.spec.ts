// tests/e2e/visual/dashboard/protocols.visual.spec.ts
import { test } from '~/tests/e2e/fixtures/component-visual';

test.describe('Protocols Page - Visual Tests', () => {
  test.beforeEach(async ({ dashboardData, setupVisualTest }) => {
    void dashboardData; // Ensure data is loaded
    await setupVisualTest();
  });

  test('should render protocols table correctly', async ({
    authenticatedPage,
    screenshotTable,
  }) => {
    await authenticatedPage.goto('/dashboard/protocols');
    await screenshotTable('protocols');
  });

  test('should render protocols page layout', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard/protocols');

    await visualHelper.waitForElements([
      '[data-testid="protocols-table"]',
      '[data-testid="add-protocol-button"]',
      '[data-testid="table-filter"]',
    ]);

    await visualHelper.screenshotPage('protocols-page');
  });

  test('should render protocol actions dropdown', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard/protocols');

    // Open actions dropdown for first protocol
    await authenticatedPage.click(
      '[data-testid="protocols-table"] tbody tr:first-child [data-testid="actions-dropdown"]',
    );

    await visualHelper.waitForElements(['[data-testid="dropdown-menu"]']);
    await visualHelper.screenshotElement(
      '[data-testid="dropdown-menu"]',
      'protocol-actions-dropdown',
    );
  });

  test('should render add protocol modal', async ({
    authenticatedPage,
    screenshotModal,
  }) => {
    await authenticatedPage.goto('/dashboard/protocols');

    await authenticatedPage.click('[data-testid="add-protocol-button"]');
    await screenshotModal('add-protocol');
  });

  test('should render protocol table with search results', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard/protocols');

    // Search for specific protocol
    await authenticatedPage.fill(
      '[data-testid="table-filter"]',
      'Test Protocol 1',
    );
    await authenticatedPage.waitForTimeout(500); // Wait for search debounce

    await visualHelper.screenshotElement(
      '[data-testid="protocols-table"]',
      'protocols-table-filter',
    );
  });

  test('should render empty protocols state', async ({
    cleanDatabase,
    authenticatedPage,
    visualHelper,
  }) => {
    await cleanDatabase();
    await authenticatedPage.goto('/dashboard/protocols');

    await visualHelper.waitForElements(['[data-testid="empty-state"]']);
    await visualHelper.screenshotPage('protocols-empty-state');
  });
});
