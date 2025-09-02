import { type Page } from '@playwright/test';
import { ADMIN_CREDENTIALS } from '../config/test-config';

/**
 * Login as admin user with standardized credentials
 * @param page - Playwright page object
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/signin');
  await page.fill(
    '[name="username"], [type="text"]',
    ADMIN_CREDENTIALS.username,
  );
  await page.fill(
    '[name="password"], [type="password"]',
    ADMIN_CREDENTIALS.password,
  );
  await page.click('[type="submit"], button:has-text("Login")');
  await page.waitForURL(/\/(dashboard|protocols|home|participants|interviews)/);
}

/**
 * Logout current user
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  await page.click('button:has-text("Sign out")');
  await page.waitForURL(/\/(signin|login)/);
}
