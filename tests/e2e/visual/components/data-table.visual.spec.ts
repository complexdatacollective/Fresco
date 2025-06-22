// tests/e2e/visual/components/data-table.visual.spec.ts
import { test } from '~/tests/e2e/fixtures/component-visual';

test.describe('Data Table Component - Visual Tests', () => {
  test.beforeEach(async ({ dashboardData, setupVisualTest }) => {
    void dashboardData; // Ensure data is loaded
    await setupVisualTest();
  });

  test('should render data table with data', async ({
    authenticatedPage,
    screenshotTable,
  }) => {
    await authenticatedPage.goto('/dashboard/protocols');
    await screenshotTable('with-data');
  });

  test('should render empty data table', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard/protocols');

    await visualHelper.waitForElements(['[data-testid="empty-state"]']);
    await visualHelper.screenshotElement(
      '[data-testid="data-table"]',
      'table-empty-state',
    );
  });

  test('should render data table loading state', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    // Intercept API to delay response
    await authenticatedPage.route('**/api/protocols', (route) => {
      setTimeout(() => route.continue(), 2000);
    });

    await authenticatedPage.goto('/dashboard/protocols');

    await visualHelper.waitForElements(['[data-testid="loading-spinner"]']);
    await visualHelper.screenshotElement(
      '[data-testid="data-table"]',
      'table-loading',
    );
  });

  test('should render data table with filter active', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard/protocols');

    await authenticatedPage.fill(
      '[data-testid="table-filter"]',
      'Test Protocol',
    );
    await authenticatedPage.waitForTimeout(500);

    await visualHelper.screenshotElement(
      '[data-testid="data-table"]',
      'table-with-filter',
    );
  });

  test('should render data table pagination states', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard/participants'); // Has more data for pagination

    // First page
    await visualHelper.screenshotElement(
      '[data-testid="pagination"]',
      'pagination-first-page',
    );

    // Go to next page if available
    const nextButton = authenticatedPage.locator(
      '[data-testid="pagination-next"]',
    );
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await visualHelper.screenshotElement(
        '[data-testid="pagination"]',
        'pagination-middle-page',
      );
    }
  });

  test('should render data table sorting indicators', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard/protocols');

    // Click on sortable column header
    await authenticatedPage.click('[data-testid="data-table"] th:first-child');

    await visualHelper.screenshotElement(
      '[data-testid="data-table"] thead',
      'table-header-sorted',
    );
  });
});
