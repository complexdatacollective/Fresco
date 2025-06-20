// tests/e2e/visual/components/form.visual.spec.ts
import { test } from '~/tests/e2e/fixtures/component-visual';

test.describe('Form Component - Visual Tests', () => {
  test.beforeEach(async ({ dashboardData, setupVisualTest }) => {
    void dashboardData; // Ensure data is loaded
    await setupVisualTest();
  });

  test('should render basic form fields', async ({
    authenticatedPage,
    screenshotForm,
  }) => {
    await authenticatedPage.goto('/dashboard/participants');
    await authenticatedPage.click('[data-testid="add-participant-button"]');
    await screenshotForm('[data-testid="participant-form"]', 'basic-fields');
  });

  test('should render form with validation errors', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard/participants');
    await authenticatedPage.click('[data-testid="add-participant-button"]');

    // Submit empty form to trigger validation
    await authenticatedPage.click('[data-testid="modal-confirm"]');

    await visualHelper.waitForElements(['[data-testid="field-error"]']);
    await visualHelper.screenshotElement(
      '[data-testid="participant-form"]',
      'form-validation-errors',
    );
  });

  test('should render form field states', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard/settings');

    const fieldStates = [
      { state: 'default', action: async () => { /* no action needed for default state */ } },
      {
        state: 'focused',
        action: async () => authenticatedPage.focus('[name="uploadThingToken"]'),
      },
      {
        state: 'filled',
        action: async () =>
          authenticatedPage.fill('[name="uploadThingToken"]', 'test-value'),
      },
    ];

    for (const { state, action } of fieldStates) {
      await action();
      await visualHelper.screenshotElement(
        '[name="uploadThingToken"]',
        `form-field-${state}`,
      );
    }
  });

  test('should render form success state', async ({
    authenticatedPage,
    visualHelper,
  }) => {
    await authenticatedPage.goto('/dashboard/settings');

    // Make a change and save
    await authenticatedPage.fill(
      '[name="uploadThingToken"]',
      'new-test-token',
    );
    await authenticatedPage.click('[data-testid="save-button"]');

    await visualHelper.waitForElements(['[data-testid="success-message"]']);
    await visualHelper.screenshotElement(
      '[data-testid="settings-form"]',
      'form-success-state',
    );
  });
});