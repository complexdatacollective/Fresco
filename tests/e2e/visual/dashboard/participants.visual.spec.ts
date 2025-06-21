// tests/e2e/visual/dashboard/participants.visual.spec.ts
import { test } from '~/tests/e2e/fixtures/component-visual';

test.describe('Participants Page - Visual Tests', () => {
  test.beforeEach(async ({ dashboardData, setupVisualTest }) => {
    void dashboardData; // Ensure data is loaded
    await setupVisualTest();
  });

  test('should render participants table correctly', async ({
    authenticatedPage,
    screenshotTable,
  }) => {
    await authenticatedPage.goto('/dashboard/participants');
    await screenshotTable('participants');
  });

  test('should render participants page layout', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard/participants');

    await visualHelper.waitForElements([
      '[data-testid="participants-table"]',
      '[data-testid="add-participant-button"]',
      '[data-testid="import-csv-button"]',
    ]);

    await visualHelper.screenshotPage('participants-page');
  });

  test('should render add participant modal', async ({
    authenticatedPage,
    screenshotComponent,
  }) => {
    await authenticatedPage.goto('/dashboard/participants');

    await authenticatedPage.click('[data-testid="add-participant-button"]');
    await screenshotComponent(
      '[data-testid="add-participant-modal"]',
      'add-participant-modal',
    );
  });

  test('should render import CSV modal', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard/participants');

    await authenticatedPage.click('[data-testid="import-csv-button"]');
    await visualHelper.screenshotElement(
      '[data-testid="import-csv-modal"]',
      'import-csv-modal',
    );
  });

  test('should render participant URL generation modal', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard/participants');

    await authenticatedPage.click(
      '[data-testid="generate-participation-url-button"]',
    );

    await visualHelper.waitForElements([
      '[data-testid="generate-participation-url-modal"]',
    ]);
    await visualHelper.screenshotElement(
      '[data-testid="generate-participation-url-modal"]',
      'participant-url-modal',
    );
  });

  test('should render participants table pagination', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard/participants');

    await visualHelper.waitForElements(['[data-testid="pagination"]']);
    await visualHelper.screenshotElement(
      '[data-testid="pagination"]',
      'participants-pagination',
    );
  });
});
