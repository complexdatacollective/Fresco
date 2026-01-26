import { expect, SNAPSHOT_CONFIGS, test } from '../../fixtures/test';

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
      const addUserButton = page.getByRole('button', { name: /add user/i });
      await expect(addUserButton).toBeVisible({ timeout: 10000 });
      await addUserButton.click();

      // Dialog should open
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Close dialog
      const closeButton = dialog
        .getByRole('button', { name: /close|cancel/i })
        .first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      } else {
        // Try clicking outside or pressing escape
        await page.keyboard.press('Escape');
      }
    } finally {
      await cleanup();
    }
  });

  test('should open change password dialog', async ({ page, database }) => {
    const cleanup = await database.isolate('change-password-dialog');
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });

    try {
      const changePasswordButton = page.getByRole('button', {
        name: /change password/i,
      });
      await expect(changePasswordButton).toBeVisible({ timeout: 10000 });
      await changePasswordButton.click();

      // Dialog should open
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Should have password fields (they use labels, not placeholders)
      await expect(dialog.getByLabel(/current password/i)).toBeVisible();

      // Close dialog
      await page.keyboard.press('Escape');
    } finally {
      await cleanup();
    }
  });

  test('should create new user', async ({ page, database }) => {
    const cleanup = await database.isolate('create-user');
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });

    try {
      const addUserButton = page.getByRole('button', { name: /add user/i });
      await expect(addUserButton).toBeVisible({ timeout: 10000 });
      await addUserButton.click();

      // Dialog should open
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Fill in user details
      const timestamp = Date.now();
      const usernameInput = dialog.getByLabel(/username/i);
      await usernameInput.fill(`testuser${timestamp}`);

      // Password inputs have accessible names but getByLabel doesn't work
      // because labels aren't associated via 'for' attribute.
      // Use locator with nth() to reliably target the password inputs.
      // Order: Username (0), Password (1), Confirm Password (2)
      const dialogInputs = dialog.locator('input');
      const passwordInput = dialogInputs.nth(1);
      await expect(passwordInput).toBeVisible({ timeout: 5000 });
      await passwordInput.fill('TestPassword123!');

      const confirmPasswordInput = dialogInputs.nth(2);
      await confirmPasswordInput.fill('TestPassword123!');

      // Submit
      const submitButton = dialog.getByRole('button', { name: /add|create/i });
      await submitButton.click();

      // Wait for dialog to close
      await expect(dialog).not.toBeVisible({ timeout: 10000 });

      // Verify user appears in the list
      await expect(page.getByText(`testuser${timestamp}`)).toBeVisible({
        timeout: 10000,
      });
    } finally {
      await cleanup();
    }
  });
});
