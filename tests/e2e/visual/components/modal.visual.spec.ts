// tests/e2e/visual/components/modal.visual.spec.ts
import { test } from '~/tests/e2e/fixtures/component-visual';

test.describe('Modal Component - Visual Tests', () => {
  test.beforeEach(async ({ dashboardData, setupVisualTest }) => {
    void dashboardData; // Ensure data is loaded
    await setupVisualTest();
  });

  test('should render basic modal', async ({
    authenticatedPage,
    screenshotModal,
  }) => {
    await authenticatedPage.goto('/dashboard/participants');
    await authenticatedPage.click('[data-testid="add-participant-button"]');
    await screenshotModal('basic');
  });

  test('should render confirmation modal', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard/protocols');

    // Open actions dropdown and click delete
    await authenticatedPage.click(
      '[data-testid="protocols-table"] tbody tr:first-child [data-testid="actions-dropdown"]',
    );
    await authenticatedPage.click('[data-testid="delete-action"]');

    await visualHelper.waitForElements([
      '[data-testid="confirmation-modal"]',
    ]);
    await visualHelper.screenshotElement(
      '[data-testid="confirmation-modal"]',
      'modal-confirmation',
    );
  });

  test('should render modal with form validation errors', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard/participants');
    await authenticatedPage.click('[data-testid="add-participant-button"]');

    // Try to submit empty form
    await authenticatedPage.click('[data-testid="modal-confirm"]');

    await visualHelper.waitForElements(['[data-testid="form-error"]']);
    await visualHelper.screenshotElement(
      '[data-testid="modal"]',
      'modal-form-errors',
    );
  });

  test('should render modal on different screen sizes', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard/participants');
    await authenticatedPage.click('[data-testid="add-participant-button"]');

    const viewportSizes = [
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 390, height: 844 },
    ];

    await visualHelper.screenshotResponsive(
      'modal-responsive',
      viewportSizes,
    );
  });
});