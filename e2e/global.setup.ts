/* eslint-disable no-console */
/* eslint-disable no-process-env */

import { expect, test } from '@playwright/test';
import { execSync } from 'child_process';

test('create test database and setup app', async ({ page }) => {
  // Stop any existing test db to ensure clean state
  try { 
    execSync('docker compose -f docker-compose.test.yml down -v', { stdio: 'inherit' });
  } catch (error) {
    // Ignore errors if no existing container
  }
  
  // Start test db
  execSync('docker compose -f docker-compose.test.yml up -d', { stdio: 'inherit' });
  
  // Optional: Wait for database to be ready
  // eslint-disable-next-line no-console
  console.log('Waiting for database to be ready');
  execSync('sleep 5', { stdio: 'inherit' });
  
  // setup database and initialize
  execSync('pnpm exec dotenv -e .env.test.local node ./setup-database.js && pnpm exec dotenv -e .env.test.local node ./initialize.js', { stdio: 'inherit' });

  test.slow(); // triple the default timeout
  // STEP 1
  await page.goto("/setup");
  await page.fill('input[name="username"]', 'test-user', { timeout: 5000 });
  await page.fill('input[name="password"]', 'TestUser1!', { timeout: 5000 });
  await page.fill('input[name="confirmPassword"]', 'TestUser1!', { timeout: 5000 });
  await page.click('button[type="submit"]', { timeout: 5000 });
  await expect(page).toHaveURL(/\/setup\?step=2/);

  // STEP 2
  // env var cannot be UPLOADTHING_TOKEN or this step will be skipped
  await page.fill('input[name="uploadThingToken"]', process.env.E2E_UPLOADTHING_TOKEN ?? '', { timeout: 5000 });
  await page.click('button[type="submit"]', { timeout: 5000 });
  await expect(page).toHaveURL(/\/setup\?step=3/);

  // STEP 3
  const protocolHandle = page.locator('input[type="file"]');
  await protocolHandle.setInputFiles('e2e/files/SampleProtocol.netcanvas');
  // check for uploading assets toast
  await expect(page.getByText('Uploading assets...')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Uploading assets...')).not.toBeVisible({ timeout: 120000 }); // long process if assets are large
  await expect(page.getByText('Complete...')).toBeVisible({ timeout: 60000 });

  await page.getByRole('button', { name: 'Continue' }).click({ timeout: 5000 });

  await expect(page).toHaveURL(/\/setup\?step=4/);

  // STEP 4
  // import participants
  await page.getByRole('button', { name: 'Import participants' }).click({ timeout: 5000 });

  // dialog should be visible
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

  const participantsHandle = page.locator('input[type="file"]');
  await participantsHandle.setInputFiles('e2e/files/participants.csv');
  await page.getByRole('button', { name: 'Import' }).click({ timeout: 5000 });

  // participants imported toast
  await expect(page.locator('div.text-sm.opacity-90', { hasText: 'Participants have been imported successfully' })).toBeVisible({ timeout: 5000 });

  // toggle switches
  const anonymousRecruitmentSwitch = page.getByRole('switch').first();
  const limitInterviewsSwitch = page.getByRole('switch').last();
  await anonymousRecruitmentSwitch.click({ timeout: 5000 });
  await limitInterviewsSwitch.click({ timeout: 5000 });

  // verify that both switches are toggled
  await expect(anonymousRecruitmentSwitch).toBeChecked();
  await expect(limitInterviewsSwitch).toBeChecked();

  await page.getByRole('button', { name: 'Continue' }).click({ timeout: 5000 });
  await expect(page).toHaveURL(/\/setup\?step=5/);

  // STEP 5 - documentation
  await page.getByRole('button', { name: 'Go to the dashboard!' }).click({ timeout: 5000 });

  await expect(page).toHaveURL(/\/dashboard/);
});