import { expect, expectURL, test } from '../../fixtures/test.js';
import { waitForDialog } from '../../helpers/dialog.js';
import {
  createVirtualAuthenticator,
  getCredentialCount,
} from '../../helpers/webauthn.js';

test.describe('Passkey Authentication', () => {
  test.beforeAll(async ({ database }) => {
    await database.restoreSnapshot();
  });

  test.beforeEach(async ({ page }) => {
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
            body: 'Mocked release notes.',
          }),
        }),
    );
  });

  test.describe('Mutations', () => {
    test.describe.configure({ mode: 'serial' });

    test('register a passkey from settings', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        const authenticator = await createVirtualAuthenticator(page.context());
        try {
          await page.goto('/dashboard/settings');

          const passkeyField = page.getByTestId('passkey-field');
          await passkeyField
            .getByRole('button', { name: /add passkey/i })
            .click();

          await expect(passkeyField.getByTestId('passkey-item')).toBeVisible({
            timeout: 15_000,
          });

          const count = await database.getUserPasskeyCount('testadmin');
          expect(count).toBe(1);

          const credCount = await getCredentialCount(authenticator);
          expect(credCount).toBe(1);
        } finally {
          await authenticator.remove();
        }
      } finally {
        await cleanup();
      }
    });

    test('sign in with passkey (discoverable flow)', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        const authenticator = await createVirtualAuthenticator(page.context());
        try {
          // Register a passkey while logged in
          await page.goto('/dashboard/settings');
          const passkeyField = page.getByTestId('passkey-field');
          await passkeyField
            .getByRole('button', { name: /add passkey/i })
            .click();
          await expect(passkeyField.getByTestId('passkey-item')).toBeVisible({
            timeout: 15_000,
          });

          // Clear auth and sign in with passkey
          await page.context().clearCookies();
          await page.goto('/signin');

          await expect(
            page.getByRole('heading', { name: /sign in/i }),
          ).toBeVisible();

          await page
            .getByRole('button', { name: /sign in with a passkey/i })
            .click();

          await expectURL(page, /\/dashboard/, { timeout: 15_000 });
        } finally {
          await authenticator.remove();
        }
      } finally {
        await cleanup();
      }
    });

    test('remove a passkey from settings', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        const authenticator = await createVirtualAuthenticator(page.context());
        try {
          await page.goto('/dashboard/settings');
          const passkeyField = page.getByTestId('passkey-field');
          await passkeyField
            .getByRole('button', { name: /add passkey/i })
            .click();
          await expect(passkeyField.getByTestId('passkey-item')).toBeVisible({
            timeout: 15_000,
          });

          // Remove the passkey
          await passkeyField.getByRole('button', { name: /remove/i }).click();

          const dialog = await waitForDialog(page);
          await dialog.getByRole('button', { name: /remove|confirm/i }).click();
          await dialog.waitFor({ state: 'hidden' });

          await expect(
            passkeyField.getByTestId('passkey-item'),
          ).not.toBeVisible();

          const count = await database.getUserPasskeyCount('testadmin');
          expect(count).toBe(0);
        } finally {
          await authenticator.remove();
        }
      } finally {
        await cleanup();
      }
    });

    test("admin resets another user's passkeys", async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        await database.seedPasskeyForUser(
          'testuser',
          'testuser-credential-id',
          'testuser-public-key',
          {
            friendlyName: 'Test User Passkey',
            aaguid: '00000000-0000-0000-0000-000000000000',
          },
        );

        await page.goto('/dashboard/settings');

        const userRow = page.getByTestId('user-row-testuser');
        await expect(userRow).toBeVisible();

        const resetButton = page.getByTestId('reset-auth-testuser');
        await expect(resetButton).toBeVisible();
        await resetButton.click();

        const dialog = await waitForDialog(page);
        await dialog.getByRole('button', { name: /reset auth/i }).click();

        await expect(
          dialog.getByRole('heading', { name: /temporary password/i }),
        ).toBeVisible({ timeout: 10_000 });

        await dialog.getByRole('button', { name: /done/i }).click();
        await dialog.waitFor({ state: 'hidden' });

        const count = await database.getUserPasskeyCount('testuser');
        expect(count).toBe(0);
      } finally {
        await cleanup();
      }
    });
  });
});
