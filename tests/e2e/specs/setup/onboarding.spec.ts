import { expect, test } from '../../fixtures/test.js';
import { expectURL } from '../../helpers/expectations.js';
import { fillField } from '../../helpers/form.js';

test.describe('Setup Flow', () => {
  test.describe.configure({ mode: 'serial' });

  // Restore the database snapshot before the suite runs. This is critical for
  // retries: the serial wizard test creates a user on the first attempt, and
  // if it times out (e.g. slow WebKit screenshots) the retry would hit a
  // unique constraint error without a clean slate.
  test.beforeAll(async ({ database }) => {
    await database.restoreSnapshot();
  });

  test('redirects to setup page on first visit', async ({ page }) => {
    await page.goto('/');
    await expectURL(page, /\/setup/);
  });

  test('visual: step 1 - create account', async ({ page, capturePage }) => {
    test.slow();
    await page.goto('/setup');
    await expect(
      page.getByRole('heading', { name: 'Create an Admin Account', level: 2 }),
    ).toBeVisible();

    await capturePage('setup-step-1-create-account');
  });

  test('completes the onboarding wizard', async ({ page, capturePage }) => {
    // This test navigates 4 wizard steps and captures screenshots at 7 viewports
    // per step (~28 screenshots). WebKit is notably slower at rendering/comparing
    // screenshots, so the default 60s timeout is insufficient.
    test.setTimeout(120_000);
    await page.goto('/setup');

    // Step 1: Create Account
    await expect(
      page.getByRole('heading', { name: 'Create an Admin Account', level: 2 }),
    ).toBeVisible();
    await fillField(page, 'username', 'testadmin');
    // The auth method radio group only renders when the browser supports WebAuthn.
    // WebKit supports WebAuthn on macOS/iOS but not on Linux, so in Docker
    // (Playwright's Linux container) the radio group is hidden and password is
    // already the implicit default — no click needed.
    const passwordRadio = page.getByRole('radio', { name: /^Password/i });
    if (await passwordRadio.isVisible()) {
      await passwordRadio.click();
    }
    await fillField(page, 'password', 'TestAdmin123!');
    await fillField(page, 'confirmPassword', 'TestAdmin123!');
    await page.getByRole('button', { name: 'Create account' }).click();

    // Step 2: Configure Storage
    await expect(
      page.getByRole('heading', { name: 'Configure Storage', level: 2 }),
    ).toBeVisible({ timeout: 15_000 });

    await capturePage('setup-step-2-configure-storage');

    // UploadThing is selected by default — fill the token field.
    // The token must be valid base64-encoded JSON with apiKey and appId fields.
    // The UPLOADTHING_TOKEN= prefix is stripped by the schema parser.
    await fillField(
      page,
      'uploadThingToken',
      'UPLOADTHING_TOKEN=eyJhcGlLZXkiOiJza19saXZlX3Rlc3QxMjMiLCJhcHBJZCI6InRlc3QtYXBwLWlkIn0=',
    );
    await page.getByRole('button', { name: 'Save and continue' }).click();

    // Step 3: Upload Protocol - skip
    await expect(
      page.getByRole('heading', { name: 'Import Protocols', level: 2 }),
    ).toBeVisible({ timeout: 15_000 });

    await capturePage('setup-step-3-import-protocols');

    await page.getByRole('button', { name: /continue/i }).click();

    // Step 4: Documentation - complete
    await expect(
      page.getByRole('heading', { name: 'Documentation', level: 2 }),
    ).toBeVisible();

    await capturePage('setup-step-4-documentation');

    await page.getByRole('button', { name: 'Go to the dashboard!' }).click();

    // Should redirect to dashboard
    await expectURL(page, /\/dashboard/);
    // Verify dashboard heading is visible
    await expect(
      page.getByRole('heading', { name: 'Dashboard' }),
    ).toBeVisible();
  });
});
