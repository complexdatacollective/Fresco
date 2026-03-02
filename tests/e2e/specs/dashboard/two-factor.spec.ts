import { expect, expectURL, test } from '../../fixtures/test.js';
import { waitForDialog } from '../../helpers/dialog.js';
import { fillField } from '../../helpers/form.js';
import { fillSegmentedCode, generateTotpCode } from '../../helpers/totp.js';

// Shared TOTP secret for seeded credentials (base32-encoded)
const TOTP_SECRET = 'JBSWY3DPEHPK3PXP';

// Recovery codes for seeded credentials
const RECOVERY_CODES = [
  'aaaabbbbccccddddeeee',
  'ffffgggghhhhiiiijjjj',
  'kkkkllllmmmmnnnnooooo',
  'ppppqqqqrrrrsssstttt',
  'uuuuvvvvwwwwxxxxyyyy',
];

test.describe('Two-Factor Authentication', () => {
  test.beforeAll(async ({ database }) => {
    await database.restoreSnapshot();
  });

  test.beforeEach(async ({ page }) => {
    // Mock GitHub API for consistent version info (same as settings.spec.ts)
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
  });

  test.describe('Mutations', () => {
    test.describe.configure({ mode: 'serial' });

    test('enable 2FA from settings (full wizard flow)', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.goto('/dashboard/settings');

        // Click Enable button on the 2FA settings field
        const twoFactorField = page.getByTestId('two-factor-field');
        await twoFactorField.getByRole('button', { name: /enable/i }).click();

        // Step 1: QR Code step — wait for dialog and QR code to load
        const dialog = await waitForDialog(page);
        await expect(dialog.getByRole('img', { name: /qr code/i })).toBeVisible(
          { timeout: 10_000 },
        );

        // Click Next to go to verify step
        await dialog.getByRole('button', { name: /next/i }).click();

        // Step 2: Verify step — enter a valid TOTP code
        // The enableTotp action generated a new secret — we can't know it,
        // so we read it from the manual entry field shown in step 1.
        // Since we already advanced, we need to go back.
        await dialog.getByRole('button', { name: /back/i }).click();

        // Read the secret from the input field
        const secretInput = dialog.locator('input[name="secret"]');
        const secret = await secretInput.inputValue();

        // Go forward again to verify step
        await dialog.getByRole('button', { name: /next/i }).click();

        // Generate a valid TOTP code from the secret
        const code = generateTotpCode(secret);

        // Fill the segmented code field
        await fillSegmentedCode(dialog, code);

        // Click Verify
        await dialog.getByRole('button', { name: /verify/i }).click();

        // Step 3: Recovery codes step — wait for codes to appear
        await expect(dialog.getByTestId('recovery-codes-list')).toBeVisible({
          timeout: 10_000,
        });

        // Click "I've saved my recovery codes"
        await dialog
          .getByRole('button', { name: /saved my recovery codes/i })
          .click();

        // Dialog should close
        await dialog.waitFor({ state: 'hidden' });

        // 2FA field should now show "Disable" button instead of "Enable"
        await expect(
          twoFactorField.getByRole('button', { name: /disable/i }),
        ).toBeVisible();
      } finally {
        await cleanup();
      }
    });

    test('login with valid TOTP code', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        // Seed TOTP for testadmin
        await database.seedTotpForUser(
          'testadmin',
          TOTP_SECRET,
          RECOVERY_CODES,
        );

        // Clear auth state by navigating to signout, then to signin
        await page.goto('/dashboard');
        await page.context().clearCookies();
        await page.goto('/signin');

        await expect(
          page.getByRole('heading', { name: /sign in/i }),
        ).toBeVisible();

        // Enter credentials
        await fillField(page, 'username', 'testadmin');
        await fillField(page, 'password', 'TestAdmin123!');
        await page.getByRole('button', { name: /sign in/i }).click();

        // 2FA form should appear with segmented code input
        await expect(
          page.getByRole('textbox', { name: /digit 1 of 6/i }),
        ).toBeVisible({ timeout: 10_000 });

        // Generate and enter valid TOTP code
        const code = generateTotpCode(TOTP_SECRET);
        await fillSegmentedCode(page, code);

        // Submit
        await page.getByRole('button', { name: /verify/i }).click();

        // Should redirect to dashboard
        await expectURL(page, /\/dashboard/);
      } finally {
        await cleanup();
      }
    });

    test('reject invalid TOTP code', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        await database.seedTotpForUser(
          'testadmin',
          TOTP_SECRET,
          RECOVERY_CODES,
        );

        await page.context().clearCookies();
        await page.goto('/signin');

        await fillField(page, 'username', 'testadmin');
        await fillField(page, 'password', 'TestAdmin123!');
        await page.getByRole('button', { name: /sign in/i }).click();

        // Wait for 2FA form
        await expect(
          page.getByRole('textbox', { name: /digit 1 of 6/i }),
        ).toBeVisible({ timeout: 10_000 });

        // Enter invalid code
        await fillSegmentedCode(page, '000000');

        await page.getByRole('button', { name: /verify/i }).click();

        // Error message should appear
        await expect(page.locator('[role="alert"]')).toBeVisible({
          timeout: 10_000,
        });

        // Should still be on signin page
        await expectURL(page, /\/signin/);
      } finally {
        await cleanup();
      }
    });

    test('login with recovery code', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        await database.seedTotpForUser(
          'testadmin',
          TOTP_SECRET,
          RECOVERY_CODES,
        );

        await page.context().clearCookies();
        await page.goto('/signin');

        await fillField(page, 'username', 'testadmin');
        await fillField(page, 'password', 'TestAdmin123!');
        await page.getByRole('button', { name: /sign in/i }).click();

        // Wait for 2FA form
        await expect(
          page.getByRole('textbox', { name: /digit 1 of 6/i }),
        ).toBeVisible({ timeout: 10_000 });

        // Switch to recovery code mode
        await page
          .getByRole('button', { name: /use a recovery code/i })
          .click();

        // Fill in a valid recovery code
        await fillField(page, 'code', RECOVERY_CODES[0]!);

        // Submit
        await page.getByRole('button', { name: /verify/i }).click();

        // Should redirect to dashboard
        await expectURL(page, /\/dashboard/);
      } finally {
        await cleanup();
      }
    });

    test('reject already-used recovery code', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        await database.seedTotpForUser(
          'testadmin',
          TOTP_SECRET,
          RECOVERY_CODES,
        );

        // Mark first recovery code as used
        await database.markRecoveryCodeUsed('testadmin', RECOVERY_CODES[0]!);

        await page.context().clearCookies();
        await page.goto('/signin');

        await fillField(page, 'username', 'testadmin');
        await fillField(page, 'password', 'TestAdmin123!');
        await page.getByRole('button', { name: /sign in/i }).click();

        // Wait for 2FA form
        await expect(
          page.getByRole('textbox', { name: /digit 1 of 6/i }),
        ).toBeVisible({ timeout: 10_000 });

        // Switch to recovery code mode
        await page
          .getByRole('button', { name: /use a recovery code/i })
          .click();

        // Try using the already-used recovery code
        await fillField(page, 'code', RECOVERY_CODES[0]!);
        await page.getByRole('button', { name: /verify/i }).click();

        // Error should appear
        await expect(page.locator('[role="alert"]')).toBeVisible({
          timeout: 10_000,
        });

        // Should still be on signin page
        await expectURL(page, /\/signin/);
      } finally {
        await cleanup();
      }
    });

    test('disable 2FA from settings', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        await database.seedTotpForUser(
          'testadmin',
          TOTP_SECRET,
          RECOVERY_CODES,
        );

        await page.goto('/dashboard/settings');

        const twoFactorField = page.getByTestId('two-factor-field');

        // Click Disable button
        await twoFactorField.getByRole('button', { name: /disable/i }).click();

        // Disable dialog should appear with verify form
        const dialog = await waitForDialog(page);
        await expect(
          dialog.getByRole('heading', { name: /disable two-factor/i }),
        ).toBeVisible();

        // Enter valid TOTP code
        const code = generateTotpCode(TOTP_SECRET);
        await fillSegmentedCode(dialog, code);

        // Click Verify
        await dialog.getByRole('button', { name: /verify/i }).click();

        // Dialog should close
        await dialog.waitFor({ state: 'hidden' });

        // 2FA field should now show "Enable" button
        await expect(
          twoFactorField.getByRole('button', { name: /enable/i }),
        ).toBeVisible();
      } finally {
        await cleanup();
      }
    });

    test("admin resets another user's 2FA", async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        // Seed TOTP for testuser (not the current admin)
        await database.seedTotpForUser('testuser', TOTP_SECRET, RECOVERY_CODES);

        await page.goto('/dashboard/settings');

        // Verify the user row shows 2FA as enabled
        const userRow = page.getByTestId('user-row-testuser');
        await expect(userRow).toBeVisible();

        // Click Reset 2FA button
        const resetButton = page.getByTestId('reset-2fa-testuser');
        await expect(resetButton).toBeVisible();
        await resetButton.click();

        // Confirmation dialog should appear
        const dialog = await waitForDialog(page);
        await expect(
          dialog.getByRole('heading', { name: /reset two-factor/i }),
        ).toBeVisible();

        // Confirm the reset
        await dialog.getByRole('button', { name: /reset 2fa/i }).click();

        // Dialog should close
        await dialog.waitFor({ state: 'hidden' });

        // Reset 2FA button should no longer be visible for testuser
        await expect(resetButton).not.toBeVisible();
      } finally {
        await cleanup();
      }
    });

    test('visual: 2FA setup wizard — QR code step', async ({
      page,
      database,
      captureElement,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.goto('/dashboard/settings');

        const twoFactorField = page.getByTestId('two-factor-field');
        await twoFactorField.getByRole('button', { name: /enable/i }).click();

        const dialog = await waitForDialog(page);
        await expect(dialog.getByRole('img', { name: /qr code/i })).toBeVisible(
          { timeout: 10_000 },
        );

        // Mask QR code and secret since they change each time
        await captureElement(dialog, 'two-factor-setup-qr-step', {
          mask: [
            dialog.getByRole('img', { name: /qr code/i }),
            dialog.locator('input[name="secret"]'),
          ],
        });
      } finally {
        await cleanup();
      }
    });

    test('visual: 2FA setup wizard — verify code step', async ({
      page,
      database,
      captureElement,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.goto('/dashboard/settings');

        const twoFactorField = page.getByTestId('two-factor-field');
        await twoFactorField.getByRole('button', { name: /enable/i }).click();

        const dialog = await waitForDialog(page);
        await expect(dialog.getByRole('img', { name: /qr code/i })).toBeVisible(
          { timeout: 10_000 },
        );

        // Advance to verify step
        await dialog.getByRole('button', { name: /next/i }).click();

        await expect(
          dialog.getByRole('textbox', { name: /digit 1 of 6/i }),
        ).toBeVisible();

        await captureElement(dialog, 'two-factor-setup-verify-step');
      } finally {
        await cleanup();
      }
    });

    test('visual: 2FA setup wizard — recovery codes step', async ({
      page,
      database,
      captureElement,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.goto('/dashboard/settings');

        const twoFactorField = page.getByTestId('two-factor-field');
        await twoFactorField.getByRole('button', { name: /enable/i }).click();

        const dialog = await waitForDialog(page);
        await expect(dialog.getByRole('img', { name: /qr code/i })).toBeVisible(
          { timeout: 10_000 },
        );

        // Read secret from step 1
        const secretInput = dialog.locator('input[name="secret"]');
        const secret = await secretInput.inputValue();

        // Advance to verify step
        await dialog.getByRole('button', { name: /next/i }).click();

        // Enter valid code
        const code = generateTotpCode(secret);
        await fillSegmentedCode(dialog, code);

        // Click Verify to advance to recovery codes step
        await dialog.getByRole('button', { name: /verify/i }).click();

        await expect(dialog.getByTestId('recovery-codes-list')).toBeVisible({
          timeout: 10_000,
        });

        // Mask recovery codes since they change each time
        await captureElement(dialog, 'two-factor-setup-recovery-codes-step', {
          mask: [dialog.getByTestId('recovery-codes-list')],
        });
      } finally {
        await cleanup();
      }
    });

    test('visual: disable 2FA dialog', async ({
      page,
      database,
      captureElement,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await database.seedTotpForUser(
          'testadmin',
          TOTP_SECRET,
          RECOVERY_CODES,
        );

        await page.goto('/dashboard/settings');

        const twoFactorField = page.getByTestId('two-factor-field');
        await twoFactorField.getByRole('button', { name: /disable/i }).click();

        const dialog = await waitForDialog(page);

        await captureElement(dialog, 'two-factor-disable-dialog');
      } finally {
        await cleanup();
      }
    });

    test('visual: admin reset 2FA confirmation dialog', async ({
      page,
      database,
      captureElement,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await database.seedTotpForUser('testuser', TOTP_SECRET, RECOVERY_CODES);

        await page.goto('/dashboard/settings');

        await page.getByTestId('reset-2fa-testuser').click();

        const dialog = await waitForDialog(page);

        await captureElement(dialog, 'two-factor-admin-reset-dialog');
      } finally {
        await cleanup();
      }
    });
  });
});
