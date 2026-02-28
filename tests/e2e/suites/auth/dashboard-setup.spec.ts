import { test } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, '../../.auth/admin.json');

test('authenticate as admin for dashboard', async ({ page, context }) => {
  // Ensure the auth directory exists
  await fs.mkdir(path.dirname(authFile), { recursive: true });

  // Navigate to login page
  await page.goto('/signin');

  // Fill in credentials using role-based selectors for better reliability
  await page.getByRole('textbox', { name: 'Username' }).fill('admin');
  await page.getByRole('textbox', { name: 'Password' }).fill('Administrator1!');

  // Submit login form
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait for successful login
  await page.waitForURL(
    /\/(dashboard|protocols|home|participants|interviews)/,
    { timeout: 10000 },
  );

  // Save the authenticated state
  await context.storageState({ path: authFile });
});
