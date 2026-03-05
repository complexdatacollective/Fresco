import { test } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  authStatePathForProject,
  saveAuthState,
} from '../../config/test-config.js';

test('authenticate as admin for dashboard', async ({
  page,
  context,
}, testInfo) => {
  const statePath = authStatePathForProject(testInfo.project.name);
  await fs.mkdir(path.dirname(statePath), { recursive: true });

  await page.goto('/signin');

  await page.getByRole('textbox', { name: 'Username' }).fill('admin');
  await page.getByRole('textbox', { name: 'Password' }).fill('Administrator1!');

  await page.getByRole('button', { name: 'Sign In' }).click();

  await page.waitForURL(
    /\/(dashboard|protocols|home|participants|interviews)/,
    { timeout: 10000 },
  );

  await saveAuthState(context, statePath);
});
