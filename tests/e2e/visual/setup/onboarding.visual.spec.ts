// tests/e2e/visual/setup/onboarding.visual.spec.ts
import { test } from '~/tests/e2e/fixtures/visual';

test.describe('Setup Onboarding - Visual Tests', () => {
  test.beforeEach(async ({ setupData, setupVisualTest }) => {
    void setupData; // Ensure data is loaded
    await setupVisualTest();
  });

  test('should render initial setup page', async ({ page, visualHelper }) => {
    await page.goto('/setup');

    await visualHelper.waitForElements([
      '[data-testid="setup-steps"]',
      '[data-testid="current-step"]',
    ]);

    await visualHelper.screenshotPage('setup-initial');
  });

  test('should render create account step', async ({ page, visualHelper }) => {
    await page.goto('/setup');

    await visualHelper.waitForElements(['[data-testid="create-account-form"]']);
    await visualHelper.screenshotElement(
      '[data-testid="create-account-form"]',
      'form-create-account',
    );
  });

  test('should render setup progress indicator', async ({
    page,
    visualHelper,
  }) => {
    await page.goto('/setup');

    await visualHelper.screenshotElement(
      '[data-testid="setup-steps"]',
      'setup-progress-step-1',
    );
  });

  test('should render setup error states', async ({ page, visualHelper }) => {
    await page.goto('/setup');

    // Try to create account with invalid data
    await page.fill('[name="username"]', '');
    await page.fill('[name="password"]', 'short');
    await page.click('[type="submit"]');

    await visualHelper.waitForElements(['[data-testid="form-error"]']);
    await visualHelper.screenshotPage('setup-account-errors');
  });
});
