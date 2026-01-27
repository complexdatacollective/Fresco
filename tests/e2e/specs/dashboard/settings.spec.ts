import { test, expect } from '../../fixtures/test.js';
import { waitForDialog } from '../../helpers/dialog.js';
import { fillField } from '../../helpers/form.js';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/settings');
  });

  test.describe('Read-only', () => {
    test('displays page heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Settings' }).first(),
      ).toBeVisible();
    });

    test('displays subtitle', async ({ page }) => {
      await expect(
        page.getByText(/configure your installation/i),
      ).toBeVisible();
    });

    test('displays user management section', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /user management/i }),
      ).toBeVisible();
    });

    test('shows admin user', async ({ page }) => {
      await expect(
        page.getByRole('table').getByText('testadmin'),
      ).toBeVisible();
    });

    test('add user button visible', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: /add user/i }),
      ).toBeVisible();
    });

    test('change password button visible', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: /change password/i }),
      ).toBeVisible();
    });

    test('displays configuration section', async ({ page }) => {
      await expect(page.getByText(/configuration/i).first()).toBeVisible();
    });

    test('displays interview settings section', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /interview settings/i }),
      ).toBeVisible();
    });

    test('anonymous recruitment toggle visible', async ({ page }) => {
      await expect(
        page.getByText(/anonymous recruitment/i).first(),
      ).toBeVisible();
    });

    test('limit interviews toggle visible', async ({ page }) => {
      await expect(page.getByText(/limit interviews/i)).toBeVisible();
    });

    test('displays privacy section', async ({ page }) => {
      await expect(page.getByText(/privacy/i).first()).toBeVisible();
    });

    test('disable analytics toggle visible', async ({ page }) => {
      await expect(page.getByText(/disable analytics/i)).toBeVisible();
    });

    test('visual snapshot', async ({ page }) => {
      await page.addStyleTag({
        content:
          '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
      });
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('settings-page.png', {
        fullPage: true,
        mask: [
          page.getByRole('heading', { name: /app version/i }).locator('..'),
        ],
      });
    });
  });

  test.describe('Mutations', () => {
    test.describe.configure({ mode: 'serial' });

    test('visual: add user dialog', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.getByRole('button', { name: /add user/i }).click();
        const dialog = await waitForDialog(page);

        await page.addStyleTag({
          content:
            '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
        });
        await page.waitForTimeout(500);
        await expect(dialog).toHaveScreenshot('settings-add-user-dialog.png');
      } finally {
        await cleanup();
      }
    });

    test('visual: change password dialog', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.getByRole('button', { name: /change password/i }).click();
        const dialog = await waitForDialog(page);

        await page.addStyleTag({
          content:
            '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
        });
        await page.waitForTimeout(500);
        await expect(dialog).toHaveScreenshot(
          'settings-change-password-dialog.png',
        );
      } finally {
        await cleanup();
      }
    });

    test('create new user', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.getByRole('button', { name: /add user/i }).click();
        const dialog = await waitForDialog(page);

        await fillField(page, 'username', 'newuser1');
        await fillField(page, 'password', 'NewUser123!');
        await fillField(page, 'confirmPassword', 'NewUser123!');

        const submitButton = dialog.getByRole('button', {
          name: /create|add|submit/i,
        });
        await submitButton.click();

        await dialog.waitFor({ state: 'hidden' });
        await page.waitForTimeout(1000);

        await expect(page.getByText('newuser1')).toBeVisible();
      } finally {
        await cleanup();
      }
    });

    test('validate username requirements', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
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

        await expect(page.getByText(/at least 4 characters/i)).toBeVisible();
      } finally {
        await cleanup();
      }
    });

    test('validate password requirements', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
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

        await expect(
          page.getByText(/Password must be at least 8 characters/),
        ).toBeVisible();
      } finally {
        await cleanup();
      }
    });

    test('toggle anonymous recruitment', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        const section = page
          .getByText('Anonymous Recruitment')
          .locator('..')
          .locator('..');
        const toggle = section.getByRole('switch');
        const initialState = await toggle.isChecked();

        const responsePromise = page.waitForResponse(
          (resp) => resp.request().method() === 'POST',
          { timeout: 10000 },
        );
        await toggle.click();
        await responsePromise;

        await page.reload();
        await page.waitForLoadState('networkidle');

        const reloadedSection = page
          .getByText('Anonymous Recruitment')
          .locator('..')
          .locator('..');
        const reloadedToggle = reloadedSection.getByRole('switch');
        const newState = await reloadedToggle.isChecked();
        expect(newState).toBe(!initialState);
      } finally {
        await cleanup();
      }
    });

    test('delete non-current user when multiple exist', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.getByRole('button', { name: /add user/i }).click();
        const dialog = await waitForDialog(page);

        await fillField(page, 'username', 'tempuser');
        await fillField(page, 'password', 'TempUser123!');
        await fillField(page, 'confirmPassword', 'TempUser123!');

        const submitButton = dialog.getByRole('button', {
          name: /create|add|submit/i,
        });
        await submitButton.click();
        await dialog.waitFor({ state: 'hidden' });
        await page.waitForTimeout(1000);

        await expect(page.getByText('tempuser')).toBeVisible();

        const tempUserRow = page.locator('text=tempuser').locator('..');
        const deleteButton = tempUserRow.getByRole('button', {
          name: /delete/i,
        });

        if (await deleteButton.isVisible()) {
          await deleteButton.click();

          const confirmDialog = page.getByRole('dialog');
          if (
            await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)
          ) {
            const confirmButton = confirmDialog.getByRole('button', {
              name: /delete|confirm/i,
            });
            await confirmButton.click();
          }

          await page.waitForTimeout(1000);
          await expect(page.getByText('tempuser')).not.toBeVisible();
        }
      } finally {
        await cleanup();
      }
    });
  });
});
