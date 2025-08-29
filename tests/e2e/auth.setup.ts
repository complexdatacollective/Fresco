import { expect, test as setup } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Go to the sign-in page
  await page.goto('/signin');

  // Check if we're already on the dashboard (already signed in)
  if (page.url().includes('/dashboard')) {
    // Already authenticated, save the current state
    await page.context().storageState({ path: authFile });
    return;
  }

  // Fill in credentials from environment
  const username = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'TEST_USERNAME and TEST_PASSWORD environment variables must be set for testing',
    );
  }

  await page.fill('[name="username"]', username);
  await page.fill('[name="password"]', password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard or setup page
  await page.waitForURL(/\/(dashboard|setup)/);

  // If we're on setup page, complete the setup
  if (page.url().includes('/setup')) {
    // Complete setup steps if needed
    // This would depend on your specific setup flow
    await page.waitForURL('/dashboard');
  }

  await expect(page).toHaveURL(/\/dashboard/);

  await page.context().storageState({ path: authFile });
});
