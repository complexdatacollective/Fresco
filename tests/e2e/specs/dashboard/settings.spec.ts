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

    test('displays preview mode section', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /preview mode/i }),
      ).toBeVisible();
    });

    test('enable preview mode toggle visible', async ({ page }) => {
      await expect(page.getByText(/enable preview mode/i)).toBeVisible();
    });

    test('authentication toggle visible', async ({ page }) => {
      const previewModeSection = page.locator('#preview-mode');
      await expect(
        previewModeSection.getByText(/authentication/i).first(),
      ).toBeVisible();
    });

    test('api tokens section visible', async ({ page }) => {
      await expect(page.getByText(/api tokens/i).first()).toBeVisible();
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
        await page.waitForLoadState('domcontentloaded');

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

    test('toggle preview mode', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        const previewModeField = page
          .getByText('Enable Preview Mode')
          .locator('..')
          .locator('..');
        const toggle = previewModeField.getByRole('switch');
        const initialState = await toggle.isChecked();

        const responsePromise = page.waitForResponse(
          (resp) => resp.request().method() === 'POST',
          { timeout: 10000 },
        );
        await toggle.click();
        await responsePromise;

        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        const reloadedField = page
          .getByText('Enable Preview Mode')
          .locator('..')
          .locator('..');
        const reloadedToggle = reloadedField.getByRole('switch');
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
        const previewModeField = page
          .getByText('Enable Preview Mode')
          .locator('..')
          .locator('..');
        const previewToggle = previewModeField.getByRole('switch');

        if (!(await previewToggle.isChecked())) {
          const responsePromise = page.waitForResponse(
            (resp) => resp.request().method() === 'POST',
            { timeout: 10000 },
          );
          await previewToggle.click();
          await responsePromise;
        }

        // Now toggle authentication
        const previewModeSection = page.locator('#preview-mode');
        const authField = previewModeSection
          .getByText('Authentication')
          .first()
          .locator('..')
          .locator('..');
        const authToggle = authField.getByRole('switch');
        const initialAuthState = await authToggle.isChecked();

        const authResponsePromise = page.waitForResponse(
          (resp) => resp.request().method() === 'POST',
          { timeout: 10000 },
        );
        await authToggle.click();
        await authResponsePromise;

        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        const reloadedAuthField = page
          .locator('#preview-mode')
          .getByText('Authentication')
          .first()
          .locator('..')
          .locator('..');
        const reloadedAuthToggle = reloadedAuthField.getByRole('switch');
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
        const previewModeField = page
          .getByText('Enable Preview Mode')
          .locator('..')
          .locator('..');
        const previewToggle = previewModeField.getByRole('switch');

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
        const createTokenButton = page.getByRole('button', {
          name: /create new token/i,
        });
        await expect(createTokenButton).toBeEnabled();
        await createTokenButton.click();

        // Wait for create dialog
        const createDialog = await waitForDialog(page);
        await expect(
          createDialog.getByText(/create api token/i).first(),
        ).toBeVisible();

        // Fill description
        await fillField(page, 'description', 'Test Token');

        // Click create
        const createButton = createDialog.getByRole('button', {
          name: /create token/i,
        });
        await createButton.click();

        // Wait for success dialog with token
        await expect(page.getByText(/api token created/i)).toBeVisible({
          timeout: 10000,
        });
        await expect(page.getByText(/your api token/i)).toBeVisible();

        // Close the success dialog
        const closeButton = page
          .getByRole('dialog')
          .getByRole('button', { name: /close/i });
        await closeButton.click();

        // Verify token appears in table
        await expect(page.getByText('Test Token')).toBeVisible();
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
        const previewModeField = page
          .getByText('Enable Preview Mode')
          .locator('..')
          .locator('..');
        const previewToggle = previewModeField.getByRole('switch');

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

        await page.getByRole('button', { name: /create new token/i }).click();
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
        const previewModeField = page
          .getByText('Enable Preview Mode')
          .locator('..')
          .locator('..');
        const previewToggle = previewModeField.getByRole('switch');

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
        await page.getByRole('button', { name: /create new token/i }).click();
        const createDialog = await waitForDialog(page);
        await createDialog
          .getByRole('button', { name: /create token/i })
          .click();

        // Wait for success dialog
        await expect(page.getByText(/api token created/i)).toBeVisible({
          timeout: 10000,
        });
        const successDialog = page.getByRole('dialog');

        await captureElement(
          successDialog,
          'settings-api-token-created-success-dialog',
          {
            // Mask the token value since it changes each time
            mask: [successDialog.locator('code')],
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
        const previewModeField = page
          .getByText('Enable Preview Mode')
          .locator('..')
          .locator('..');
        const previewToggle = previewModeField.getByRole('switch');

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
        await page.getByRole('button', { name: /create new token/i }).click();
        const createDialog = await waitForDialog(page);
        await fillField(page, 'description', 'Token to Delete');
        await createDialog
          .getByRole('button', { name: /create token/i })
          .click();

        // Wait for success dialog and close it
        await expect(page.getByText(/api token created/i)).toBeVisible({
          timeout: 10000,
        });
        await page
          .getByRole('dialog')
          .getByRole('button', { name: /close/i })
          .click();

        // Click delete on the token
        const tokenRow = page
          .getByText('Token to Delete')
          .locator('..')
          .locator('..');
        await tokenRow.getByRole('button', { name: /delete/i }).click();

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
        const previewModeField = page
          .getByText('Enable Preview Mode')
          .locator('..')
          .locator('..');
        const previewToggle = previewModeField.getByRole('switch');

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
        await page.getByRole('button', { name: /create new token/i }).click();
        const createDialog = await waitForDialog(page);
        await fillField(page, 'description', 'Token to Delete');
        await createDialog
          .getByRole('button', { name: /create token/i })
          .click();

        // Wait for success dialog and close it
        await expect(page.getByText(/api token created/i)).toBeVisible({
          timeout: 10000,
        });
        await page
          .getByRole('dialog')
          .getByRole('button', { name: /close/i })
          .click();

        // Verify token exists
        await expect(page.getByText('Token to Delete')).toBeVisible();

        // Find and click the delete button for our token
        const tokenRow = page
          .getByText('Token to Delete')
          .locator('..')
          .locator('..');
        const deleteButton = tokenRow.getByRole('button', { name: /delete/i });
        await deleteButton.click();

        // Wait for delete confirmation dialog
        const deleteDialog = await waitForDialog(page);
        await expect(deleteDialog.getByText(/delete api token/i)).toBeVisible();

        // Confirm deletion
        await deleteDialog
          .getByRole('button', { name: /delete token/i })
          .click();

        // Wait for dialog to close and deletion to complete
        await deleteDialog.waitFor({ state: 'hidden' });

        // Verify token is removed
        await expect(page.getByText('Token to Delete')).not.toBeVisible();
      } finally {
        await cleanup();
      }
    });
  });
});
