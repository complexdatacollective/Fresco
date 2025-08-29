import { test as setup } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ADMIN_CREDENTIALS } from '../config/test-config';

const authFile = path.join(__dirname, '../.auth/admin.json');

/**
 * Authenticate once and save the session for reuse in all tests
 */
setup('authenticate as admin', async ({ page, context }) => {
  // Ensure the auth directory exists
  await fs.mkdir(path.dirname(authFile), { recursive: true });
  
  // Navigate to login page
  await page.goto('/signin');
  
  // Fill in credentials
  await page.fill('[name="username"], [type="text"]', ADMIN_CREDENTIALS.username);
  await page.fill('[name="password"], [type="password"]', ADMIN_CREDENTIALS.password);
  
  // Submit login form
  await page.click('[type="submit"], button:has-text("Login")');
  
  // Wait for successful login
  await page.waitForURL(/\/(dashboard|protocols|home|participants|interviews)/);
  
  // Save the authenticated state
  await context.storageState({ path: authFile });
});