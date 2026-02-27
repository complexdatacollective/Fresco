import { expect, SNAPSHOT_CONFIGS, test } from '../../fixtures/fixtures';
import {
  closeDialog,
  openDialog,
  waitForDialogToClose,
} from '../../utils/dialog-helpers';
import { fillFormField, getFormFieldInput } from '../../utils/form-helpers';

test.describe.parallel('Settings page - parallel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });
  });

  test('should match visual snapshot', async ({ snapshots }) => {
    await snapshots.expectPageToMatchSnapshot(
      SNAPSHOT_CONFIGS.fullPage('settings-page'),
    );
  });

  test('should display settings heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Settings', exact: true }),
    ).toBeVisible();
  });

  test('should display settings subtitle', async ({ page }) => {
    await expect(
      page.getByText(/configure your installation of Fresco/i),
    ).toBeVisible();
  });

  test('should display user management section', async ({ page }) => {
    await expect(page.getByText(/user management/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display configuration section', async ({ page }) => {
    await expect(page.getByText(/configuration/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display interview settings section', async ({ page }) => {
    await expect(page.getByText(/interview settings/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display privacy section', async ({ page }) => {
    await expect(page.getByText(/privacy/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display anonymous recruitment toggle', async ({ page }) => {
    // Look for the anonymous recruitment setting
    await expect(page.getByText(/anonymous recruitment/i).first()).toBeVisible({
      timeout: 10000,
    });

    // Should have a switch/toggle
    const anonymousSwitch = page.getByRole('switch').first();
    await expect(anonymousSwitch).toBeVisible();
  });

  test('should display limit interviews toggle', async ({ page }) => {
    await expect(page.getByText(/limit interviews/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display disable analytics toggle', async ({ page }) => {
    await expect(page.getByText(/disable analytics/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display users table', async ({ page }) => {
    // Look for users table or list in user management section
    await expect(page.getByText(/user management/i).first()).toBeVisible({
      timeout: 10000,
    });

    // Should show the admin user
    await expect(page.getByText('admin').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display add user button', async ({ page }) => {
    const addUserButton = page.getByRole('button', { name: /add user/i });
    await expect(addUserButton).toBeVisible({ timeout: 10000 });
  });

  test('should display change password button', async ({ page }) => {
    const changePasswordButton = page.getByRole('button', {
      name: /change password/i,
    });
    await expect(changePasswordButton).toBeVisible({ timeout: 10000 });
  });

  test('should display installation ID field', async ({ page }) => {
    await expect(page.getByText(/installation id/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display version information', async ({ page }) => {
    // Check for app version section
    await expect(page.getByText(/version/i).first()).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe.serial('Settings page - serial', () => {
  test('visual: add user dialog', async ({ page, database, snapshots }) => {
    const cleanup = await database.isolate('add-user-dialog-visual');
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });

    try {
      await openDialog(page, /add user/i);

      await snapshots.expectPageToMatchSnapshot(
        SNAPSHOT_CONFIGS.modal('settings-add-user-dialog'),
      );

      await closeDialog(page);
    } finally {
      await cleanup();
    }
  });

  test('visual: change password dialog', async ({
    page,
    database,
    snapshots,
  }) => {
    const cleanup = await database.isolate('change-password-dialog-visual');
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });

    try {
      await openDialog(page, /change password/i);

      await snapshots.expectPageToMatchSnapshot(
        SNAPSHOT_CONFIGS.modal('settings-change-password-dialog'),
      );

      await closeDialog(page);
    } finally {
      await cleanup();
    }
  });

  test('should toggle anonymous recruitment switch', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('anonymous-recruitment-toggle');
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });

    try {
      // Find the anonymous recruitment section
      await expect(
        page.getByText(/anonymous recruitment/i).first(),
      ).toBeVisible({ timeout: 10000 });

      // Get the switch associated with anonymous recruitment
      const switches = page.getByRole('switch');
      const firstSwitch = switches.first();
      await expect(firstSwitch).toBeVisible();

      // Get initial state
      const initialState = await firstSwitch.getAttribute('aria-checked');

      // Click to toggle
      await firstSwitch.click();
      await page.waitForTimeout(500);

      // Verify state changed
      const newState = await firstSwitch.getAttribute('aria-checked');
      expect(newState).not.toBe(initialState);
    } finally {
      await cleanup();
    }
  });

  test('should open add user dialog', async ({ page, database }) => {
    const cleanup = await database.isolate('add-user-dialog');
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });

    try {
      await openDialog(page, /add user/i);

      // Close dialog
      await closeDialog(page);
    } finally {
      await cleanup();
    }
  });

  test('should open change password dialog', async ({ page, database }) => {
    const cleanup = await database.isolate('change-password-dialog');
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });

    try {
      const dialog = await openDialog(page, /change password/i);

      // Should have password fields
      await expect(getFormFieldInput(dialog, 'currentPassword')).toBeVisible();

      // Close dialog
      await closeDialog(page);
    } finally {
      await cleanup();
    }
  });

  test('should create new user', async ({ page, database }) => {
    const cleanup = await database.isolate('create-user');
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });

    try {
      const dialog = await openDialog(page, /add user/i);

      // Fill in user details
      const timestamp = Date.now();
      await fillFormField(dialog, 'username', `testuser${timestamp}`);
      await fillFormField(dialog, 'password', 'TestPassword123!');
      await fillFormField(dialog, 'confirmPassword', 'TestPassword123!');

      // Submit
      const submitButton = dialog.getByRole('button', { name: /add|create/i });
      await submitButton.click();

      // Wait for dialog to close
      await waitForDialogToClose(page);

      // Verify user appears in the list
      await expect(page.getByText(`testuser${timestamp}`)).toBeVisible({
        timeout: 10000,
      });
    } finally {
      await cleanup();
    }
  });

  test('should validate username requirements when creating user', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('validate-username');
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });

    try {
      const dialog = await openDialog(page, /add user/i);

      // Try username that's too short (less than 4 characters)
      const usernameInput = getFormFieldInput(dialog, 'username');
      await usernameInput.fill('abc');
      await usernameInput.blur();

      // Wait for validation message
      await page.waitForTimeout(600); // Wait for validation delay
      await expect(dialog.getByText(/at least 4 characters/i)).toBeVisible({
        timeout: 5000,
      });

      // Try username with spaces
      await usernameInput.fill('test user');
      await usernameInput.blur();
      await page.waitForTimeout(600);
      await expect(dialog.getByText(/cannot contain spaces/i)).toBeVisible({
        timeout: 5000,
      });

      // Close dialog
      await closeDialog(page);
    } finally {
      await cleanup();
    }
  });

  test('should validate password requirements when creating user', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('validate-password');
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });

    try {
      const dialog = await openDialog(page, /add user/i);

      // Fill valid username first
      await fillFormField(dialog, 'username', 'testuser123');

      // Try password that's too short
      const passwordInput = getFormFieldInput(dialog, 'password');
      await passwordInput.fill('short');
      await passwordInput.blur();
      await expect(dialog.getByText(/at least 8 characters/i)).toBeVisible({
        timeout: 5000,
      });

      // Close dialog
      await closeDialog(page);
    } finally {
      await cleanup();
    }
  });

  test('should show delete button disabled for current user', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('delete-current-user');
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });

    try {
      // Find the current user row (marked with "(you)")
      const currentUserRow = page.locator('tr', { hasText: '(you)' });
      await expect(currentUserRow).toBeVisible({ timeout: 10000 });

      // The delete button for the current user should be disabled
      const deleteButton = currentUserRow.getByRole('button', {
        name: /delete/i,
      });
      await expect(deleteButton).toBeDisabled();
    } finally {
      await cleanup();
    }
  });

  test('should show delete button disabled when only one user exists', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('delete-last-user');
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });

    try {
      // Get all user rows in the table
      const userRows = page.locator('tbody tr');
      const rowCount = await userRows.count();

      // If there's only one user, all delete buttons should be disabled
      if (rowCount === 1) {
        const deleteButton = userRows
          .first()
          .getByRole('button', { name: /delete/i });
        await expect(deleteButton).toBeDisabled();
      }
    } finally {
      await cleanup();
    }
  });

  test('should enable delete button for non-current users when multiple exist', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('delete-other-user');
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });

    try {
      // First create a second user
      const dialog = await openDialog(page, /add user/i);

      const timestamp = Date.now();
      await fillFormField(dialog, 'username', `tempuser${timestamp}`);
      await fillFormField(dialog, 'password', 'TestPassword123!');
      await fillFormField(dialog, 'confirmPassword', 'TestPassword123!');

      const submitButton = dialog.getByRole('button', { name: /add|create/i });
      await submitButton.click();
      await waitForDialogToClose(page);

      // Now find the new user's row (not marked with "(you)")
      const newUserRow = page.locator('tr', {
        hasText: `tempuser${timestamp}`,
      });
      await expect(newUserRow).toBeVisible({ timeout: 10000 });

      // The delete button for the new user should be enabled
      const deleteButton = newUserRow.getByRole('button', { name: /delete/i });
      await expect(deleteButton).toBeEnabled();
    } finally {
      await cleanup();
    }
  });

  test('should show confirmation dialog when deleting user', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('delete-user-confirmation');
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });

    try {
      // First create a second user
      const addDialog = await openDialog(page, /add user/i);

      const timestamp = Date.now();
      await fillFormField(addDialog, 'username', `deletetest${timestamp}`);
      await fillFormField(addDialog, 'password', 'TestPassword123!');
      await fillFormField(addDialog, 'confirmPassword', 'TestPassword123!');

      const submitButton = addDialog.getByRole('button', {
        name: /add|create/i,
      });
      await submitButton.click();
      await waitForDialogToClose(page);

      // Find the new user's row and click delete
      const newUserRow = page.locator('tr', {
        hasText: `deletetest${timestamp}`,
      });
      await expect(newUserRow).toBeVisible({ timeout: 10000 });

      const deleteButton = newUserRow.getByRole('button', { name: /delete/i });
      await deleteButton.click();

      // Confirmation dialog should appear
      const confirmDialog = page.getByRole('dialog').last();
      await expect(confirmDialog).toBeVisible({ timeout: 5000 });
      await expect(confirmDialog).toContainText(/delete user/i);
      await expect(confirmDialog).toContainText(`deletetest${timestamp}`);

      // Cancel the deletion
      const cancelButton = confirmDialog.getByRole('button', {
        name: /cancel/i,
      });
      await cancelButton.click();

      // Dialog should close and user should still exist
      await expect(confirmDialog).not.toBeVisible({ timeout: 5000 });
      await expect(
        page.getByText(`deletetest${timestamp}`, { exact: true }),
      ).toBeVisible();
    } finally {
      await cleanup();
    }
  });

  test('should validate change password form', async ({ page, database }) => {
    const cleanup = await database.isolate('change-password-validation');
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });

    try {
      const dialog = await openDialog(page, /change password/i);

      // Try a password that doesn't meet requirements (too short)
      const newPasswordInput = getFormFieldInput(dialog, 'newPassword');
      await newPasswordInput.fill('short');
      await newPasswordInput.blur();

      // Should show validation error
      await expect(dialog.getByText(/at least 8 characters/i)).toBeVisible({
        timeout: 5000,
      });

      // Close dialog
      await closeDialog(page);
    } finally {
      await cleanup();
    }
  });
});
