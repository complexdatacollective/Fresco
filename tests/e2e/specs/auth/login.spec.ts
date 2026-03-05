import {
  authStatePathForProject,
  saveAuthState,
} from '../../config/test-config.js';
import { expect, expectURL, test } from '../../fixtures/test.js';
import { fillField } from '../../helpers/form.js';
import fs from 'node:fs/promises';
import path from 'node:path';

test.describe('Sign In Page', () => {
  test('visual: sign in page', async ({ page, capturePage }) => {
    await page.goto('/signin');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

    await capturePage('signin-page');
  });

  test('trouble signing in link visible', async ({ page }) => {
    await page.goto('/signin');
    await expect(
      page.getByRole('button', { name: /trouble signing in/i }),
    ).toBeVisible();
  });

  test('authenticate as admin and save state', async ({ page }, testInfo) => {
    const statePath = authStatePathForProject(testInfo.project.name);
    await fs.mkdir(path.dirname(statePath), { recursive: true });

    await page.goto('/signin');

    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

    await fillField(page, 'username', 'testadmin');
    await fillField(page, 'password', 'TestAdmin123!');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    await expectURL(page, /\/dashboard/);

    await saveAuthState(page, statePath);
  });
});
