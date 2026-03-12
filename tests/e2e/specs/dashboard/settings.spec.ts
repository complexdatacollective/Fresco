import { expect, test } from '../../fixtures/test.js';
import { waitForDialog } from '../../helpers/dialog.js';
import { fillField } from '../../helpers/form.js';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock GitHub API to return consistent version info for visual snapshots
    await page.route(
      'https://api.github.com/repos/complexdatacollective/fresco/releases/latest',
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            html_url:
              'https://github.com/complexdatacollective/fresco/releases/tag/v3.0.0',
            tag_name: 'v3.0.0',
            body: 'Mocked release notes for testing.',
          }),
        }),
    );

    await page.goto('/dashboard/settings');
  });

  test('displays page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Settings', level: 1 }),
    ).toBeVisible();
  });

  test('displays user management section', async ({ page }) => {
    await expect(page.getByTestId('user-management-card')).toBeVisible();
  });

  test('shows admin user', async ({ page }) => {
    await expect(page.getByTestId('user-row-testadmin')).toBeVisible();
  });

  test('add user button visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /add user/i })).toBeVisible();
  });

  test('change password button visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /change password/i }),
    ).toBeVisible();
  });

  test('displays configuration section', async ({ page }) => {
    await expect(page.getByTestId('configuration-card')).toBeVisible();
  });

  test('displays interview settings section', async ({ page }) => {
    await expect(page.getByTestId('interview-settings-card')).toBeVisible();
  });

  test('anonymous recruitment toggle visible', async ({ page }) => {
    await expect(page.getByTestId('anonymous-recruitment-field')).toBeVisible();
  });

  test('limit interviews toggle visible', async ({ page }) => {
    await expect(page.getByTestId('limit-interviews-field')).toBeVisible();
  });

  test('displays privacy section', async ({ page }) => {
    await expect(page.getByTestId('privacy-card')).toBeVisible();
  });

  test('disable analytics toggle visible', async ({ page }) => {
    await expect(page.getByTestId('disable-analytics-field')).toBeVisible();
  });

  test('displays preview mode section', async ({ page }) => {
    await expect(page.getByTestId('preview-mode-card')).toBeVisible();
  });

  test('enable preview mode toggle visible', async ({ page }) => {
    await expect(page.getByTestId('enable-preview-mode-field')).toBeVisible();
  });

  test('authentication toggle visible', async ({ page }) => {
    await expect(page.getByTestId('preview-mode-auth-field')).toBeVisible();
  });

  test('api tokens section visible', async ({ page }) => {
    await expect(page.getByTestId('api-tokens-card')).toBeVisible();
  });

  test('visual snapshot', async ({ page, capturePage }) => {
    await capturePage('settings-page', {
      // Mask the version/commit text which varies between environments
      mask: [page.getByTestId('app-version-info')],
    });
  });

  test('visual: add user dialog', async ({ page, captureElement }) => {
    await page.getByRole('button', { name: /add user/i }).click();
    const dialog = await waitForDialog(page);

    await captureElement(dialog, 'settings-add-user-dialog');
  });

  test('visual: change password dialog', async ({ page, captureElement }) => {
    await page.getByRole('button', { name: /change password/i }).click();
    const dialog = await waitForDialog(page);

    await captureElement(dialog, 'settings-change-password-dialog');
  });

  test('validate username requirements', async ({ page }) => {
    await page.getByRole('button', { name: /add user/i }).click();
    await waitForDialog(page);

    await fillField(page, 'username', 'ab');
    await fillField(page, 'password', 'ValidPass123!');
    await fillField(page, 'confirmPassword', 'ValidPass123!');

    const dialog = page.getByRole('dialog');
    const submitButton = dialog.getByRole('button', {
      name: /create|add|submit/i,
    });
    await submitButton.click();

    await expect(page.getByTestId('username-field-error')).toBeVisible();
  });

  test('validate password requirements', async ({ page }) => {
    await page.getByRole('button', { name: /add user/i }).click();
    await waitForDialog(page);

    await fillField(page, 'username', 'validuser');
    await fillField(page, 'password', 'weak');
    await fillField(page, 'confirmPassword', 'weak');

    const dialog = page.getByRole('dialog');
    const submitButton = dialog.getByRole('button', {
      name: /create|add|submit/i,
    });
    await submitButton.click();

    await expect(page.getByTestId('password-field-error')).toBeVisible();
  });
});
