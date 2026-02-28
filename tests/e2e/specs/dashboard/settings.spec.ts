import { expect, test } from '../../fixtures/test.js';
import { waitForDialog } from '../../helpers/dialog.js';
import { fillField } from '../../helpers/form.js';

test.describe('Settings Page', () => {
  // Acquire shared lock and restore database - protects read-only tests from
  // concurrent mutations in other workers
  test.beforeAll(async ({ database }) => {
    await database.restoreSnapshot();
  });

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

  test.describe('Read-only', () => {
    // Release shared lock after read-only tests complete, before mutations start.
    // This reduces wait time for mutation tests that need exclusive locks.
    test.afterAll(async ({ database }) => {
      await database.releaseReadLock();
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
      await expect(page.getByTestId('configuration-card')).toBeVisible();
    });

    test('displays interview settings section', async ({ page }) => {
      await expect(page.getByTestId('interview-settings-card')).toBeVisible();
    });

    test('anonymous recruitment toggle visible', async ({ page }) => {
      await expect(
        page.getByTestId('anonymous-recruitment-field'),
      ).toBeVisible();
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
      await expect(page.getByTestId('api-tokens-field')).toBeVisible();
    });

    test('visual snapshot', async ({ page, capturePage }) => {
      await capturePage('settings-page', {
        // Mask the version/commit text which varies between environments
        mask: [page.getByTestId('app-version-info')],
      });
    });
  });

  test.describe('Mutations', () => {
    test.describe.configure({ mode: 'serial' });

    test('visual: add user dialog', async ({
      page,
      database,
      captureElement,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.getByRole('button', { name: /add user/i }).click();
        const dialog = await waitForDialog(page);

        await captureElement(dialog, 'settings-add-user-dialog');
      } finally {
        await cleanup();
      }
    });

    test('visual: change password dialog', async ({
      page,
      database,
      captureElement,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.getByRole('button', { name: /change password/i }).click();
        const dialog = await waitForDialog(page);

        await captureElement(dialog, 'settings-change-password-dialog');
      } finally {
        await cleanup();
      }
    });

    test('create new user', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        // Clean up user from previous retries (User table excluded from snapshots)
        await database.deleteUser('newuser1');
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

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

        await expect(page.getByTestId('user-row-newuser1')).toBeVisible({
          timeout: 10000,
        });
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

        await expect(page.getByTestId('username-field-error')).toBeVisible();
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

        await expect(page.getByTestId('password-field-error')).toBeVisible();
      } finally {
        await cleanup();
      }
    });

    test('toggle anonymous recruitment', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        const toggle = page
          .getByTestId('anonymous-recruitment-field')
          .getByRole('switch');
        const initialState = await toggle.isChecked();

        const responsePromise = page.waitForResponse(
          (resp) => resp.request().method() === 'POST',
          { timeout: 10000 },
        );
        await toggle.click();
        await responsePromise;

        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        const reloadedToggle = page
          .getByTestId('anonymous-recruitment-field')
          .getByRole('switch');
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
        // Clean up user from previous retries (User table excluded from snapshots)
        await database.deleteUser('tempuser');
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

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

        await expect(page.getByTestId('user-row-tempuser')).toBeVisible({
          timeout: 10000,
        });

        const deleteButton = page.getByTestId('delete-user-tempuser');

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
          await expect(page.getByTestId('user-row-tempuser')).not.toBeVisible();
        }
      } finally {
        await cleanup();
      }
    });

    test('toggle preview mode', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        const toggle = page
          .getByTestId('enable-preview-mode-field')
          .getByRole('switch');
        const initialState = await toggle.isChecked();

        const responsePromise = page.waitForResponse(
          (resp) => resp.request().method() === 'POST',
          { timeout: 10000 },
        );
        await toggle.click();
        await responsePromise;

        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        const reloadedToggle = page
          .getByTestId('enable-preview-mode-field')
          .getByRole('switch');
        const newState = await reloadedToggle.isChecked();
        expect(newState).toBe(!initialState);
      } finally {
        await cleanup();
      }
    });

    test('toggle preview mode authentication', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        // First enable preview mode
        const previewToggle = page
          .getByTestId('enable-preview-mode-field')
          .getByRole('switch');

        if (!(await previewToggle.isChecked())) {
          const responsePromise = page.waitForResponse(
            (resp) => resp.request().method() === 'POST',
            { timeout: 10000 },
          );
          await previewToggle.click();
          await responsePromise;
          // Reload so the server re-renders with previewMode=true,
          // which enables the auth toggle (disabled={!previewMode})
          await page.reload();
          await page.waitForLoadState('domcontentloaded');
        }

        // Now toggle authentication
        const authToggle = page
          .getByTestId('preview-mode-auth-field')
          .getByRole('switch');
        await expect(authToggle).toBeEnabled();
        const initialAuthState = await authToggle.isChecked();

        const authResponsePromise = page.waitForResponse(
          (resp) => resp.request().method() === 'POST',
          { timeout: 10000 },
        );
        await authToggle.click();
        await authResponsePromise;

        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        const reloadedAuthToggle = page
          .getByTestId('preview-mode-auth-field')
          .getByRole('switch');
        const newAuthState = await reloadedAuthToggle.isChecked();
        expect(newAuthState).toBe(!initialAuthState);
      } finally {
        await cleanup();
      }
    });

    test('create api token', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        // First enable preview mode
        const previewToggle = page
          .getByTestId('enable-preview-mode-field')
          .getByRole('switch');

        if (!(await previewToggle.isChecked())) {
          const responsePromise = page.waitForResponse(
            (resp) => resp.request().method() === 'POST',
            { timeout: 10000 },
          );
          await previewToggle.click();
          await responsePromise;
          // Wait for the page to reflect changes
          await page.reload();
          await page.waitForLoadState('domcontentloaded');
        }

        // Click create token button
        const createTokenButton = page.getByTestId('create-token-button');
        await expect(createTokenButton).toBeEnabled();
        await createTokenButton.click();

        // Wait for create dialog
        const createDialog = await waitForDialog(page);
        await expect(
          createDialog.getByRole('heading', { name: /create api token/i }),
        ).toBeVisible();

        // Fill description
        await fillField(page, 'description', 'Test Token');

        // Click create
        const createButton = page.getByTestId('confirm-create-token-button');
        await createButton.click();

        // Wait for success dialog with token
        await expect(page.getByTestId('created-token-alert')).toBeVisible({
          timeout: 10000,
        });

        // Close the success dialog
        const closeButton = page.getByTestId('close-token-dialog-button');
        await closeButton.click();

        // Verify token appears in table
        await expect(page.getByTestId('token-row-Test Token')).toBeVisible();
      } finally {
        await cleanup();
      }
    });

    test('visual: create api token dialog', async ({
      page,
      database,
      captureElement,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        // Enable preview mode first
        const previewToggle = page
          .getByTestId('enable-preview-mode-field')
          .getByRole('switch');

        if (!(await previewToggle.isChecked())) {
          const responsePromise = page.waitForResponse(
            (resp) => resp.request().method() === 'POST',
            { timeout: 10000 },
          );
          await previewToggle.click();
          await responsePromise;
          await page.reload();
          await page.waitForLoadState('domcontentloaded');
        }

        await page.getByTestId('create-token-button').click();
        const dialog = await waitForDialog(page);

        await captureElement(dialog, 'settings-create-api-token-dialog');
      } finally {
        await cleanup();
      }
    });

    test('visual: api token created success dialog', async ({
      page,
      database,
      captureElement,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        // Enable preview mode first
        const previewToggle = page
          .getByTestId('enable-preview-mode-field')
          .getByRole('switch');

        if (!(await previewToggle.isChecked())) {
          const responsePromise = page.waitForResponse(
            (resp) => resp.request().method() === 'POST',
            { timeout: 10000 },
          );
          await previewToggle.click();
          await responsePromise;
          await page.reload();
          await page.waitForLoadState('domcontentloaded');
        }

        // Create token
        await page.getByTestId('create-token-button').click();
        await waitForDialog(page);
        await page.getByTestId('confirm-create-token-button').click();

        // Wait for success dialog
        await expect(page.getByTestId('created-token-alert')).toBeVisible({
          timeout: 10000,
        });
        const successDialog = page.getByRole('dialog');

        await captureElement(
          successDialog,
          'settings-api-token-created-success-dialog',
          {
            // Mask the token value since it changes each time
            mask: [page.getByTestId('created-token-alert')],
          },
        );
      } finally {
        await cleanup();
      }
    });

    test('visual: delete api token dialog', async ({
      page,
      database,
      captureElement,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        // Enable preview mode first
        const previewToggle = page
          .getByTestId('enable-preview-mode-field')
          .getByRole('switch');

        if (!(await previewToggle.isChecked())) {
          const responsePromise = page.waitForResponse(
            (resp) => resp.request().method() === 'POST',
            { timeout: 10000 },
          );
          await previewToggle.click();
          await responsePromise;
          await page.reload();
          await page.waitForLoadState('domcontentloaded');
        }

        // Create a token first
        await page.getByTestId('create-token-button').click();
        await waitForDialog(page);
        await fillField(page, 'description', 'Token to Delete');
        await page.getByTestId('confirm-create-token-button').click();

        // Wait for success dialog and close it
        await expect(page.getByTestId('created-token-alert')).toBeVisible({
          timeout: 10000,
        });
        await page.getByTestId('close-token-dialog-button').click();

        // Click delete on the token
        await page.getByTestId('delete-token-Token to Delete').click();

        const deleteDialog = await waitForDialog(page);
        await captureElement(deleteDialog, 'settings-delete-api-token-dialog');
      } finally {
        await cleanup();
      }
    });

    test('delete api token', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        // First enable preview mode
        const previewToggle = page
          .getByTestId('enable-preview-mode-field')
          .getByRole('switch');

        if (!(await previewToggle.isChecked())) {
          const responsePromise = page.waitForResponse(
            (resp) => resp.request().method() === 'POST',
            { timeout: 10000 },
          );
          await previewToggle.click();
          await responsePromise;
          await page.reload();
          await page.waitForLoadState('domcontentloaded');
        }

        // Create a token first
        await page.getByTestId('create-token-button').click();
        await waitForDialog(page);
        await fillField(page, 'description', 'Token to Delete');
        await page.getByTestId('confirm-create-token-button').click();

        // Wait for success dialog and close it
        await expect(page.getByTestId('created-token-alert')).toBeVisible({
          timeout: 10000,
        });
        await page.getByTestId('close-token-dialog-button').click();

        // Verify token exists
        await expect(
          page.getByTestId('token-row-Token to Delete'),
        ).toBeVisible();

        // Find and click the delete button for our token
        await page.getByTestId('delete-token-Token to Delete').click();

        // Wait for delete confirmation dialog
        const deleteDialog = await waitForDialog(page);
        await expect(
          deleteDialog.getByRole('heading', { name: /delete api token/i }),
        ).toBeVisible();

        // Confirm deletion
        await page.getByTestId('confirm-delete-token-button').click();

        // Wait for dialog to close and deletion to complete
        await deleteDialog.waitFor({ state: 'hidden' });

        // Verify token is removed
        await expect(
          page.getByTestId('token-row-Token to Delete'),
        ).not.toBeVisible();
      } finally {
        await cleanup();
      }
    });
  });
});
