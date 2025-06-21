// tests/e2e/visual/setup/onboarding.visual.spec.ts
import { test } from '~/tests/e2e/fixtures/visual';
import { cleanDatabase } from '../../utils/database/cleanup';

test.describe('Setup Onboarding - Visual Tests', () => {
  test('should render initial setup page', async ({ page, visualHelper }) => {
    await cleanDatabase({ seed: false });
    await page.goto('/setup');

    await visualHelper.waitForElements([
      '[data-testid="setup-steps"]',
      '[data-testid="create-account-form"]',
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
});
