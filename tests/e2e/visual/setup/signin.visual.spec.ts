// tests/e2e/visual/setup/signin.visual.spec.ts
import { test } from '~/tests/e2e/fixtures/visual';

test.describe('Signin Page - Visual Tests', () => {
  test.beforeEach(async ({ basicData, setupVisualTest }) => {
    void basicData; // Ensure data is loaded
    await setupVisualTest();
  });

  test('should render signin page layout', async ({ page, visualHelper }) => {
    await page.goto('/signin');
    await visualHelper.screenshotPage('signin-page');
  });

  test('should render signin form', async ({ page, visualHelper }) => {
    await page.goto('/signin');
    await visualHelper.waitForElements(['form']);
    await visualHelper.screenshotElement('form', 'form-signin');
  });

  test('should render signin form with validation errors', async ({
    page,
    visualHelper,
  }) => {
    await page.goto('/signin');

    // Try to login with empty fields
    await page.click('[type="submit"]');

    await visualHelper.waitForElements(['[data-testid="form-error"]']);
    await visualHelper.screenshotPage('signin-validation-errors');
  });

  test('should render signin form with invalid credentials error', async ({
    page,
    visualHelper,
  }) => {
    await page.goto('/signin');

    await page.fill('[name="username"]', 'invalid-user');
    await page.fill('[name="password"]', 'invalid-password');
    await page.click('[type="submit"]');

    await visualHelper.waitForElements(['[data-testid="error-message"]']);
    await visualHelper.screenshotPage('signin-invalid-credentials');
  });
});
