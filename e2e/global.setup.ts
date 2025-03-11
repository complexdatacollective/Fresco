/* eslint-disable no-console */
/* eslint-disable no-process-env */

import { expect, test } from '@playwright/test';
import { execSync } from 'child_process';

test('create test database and setup app', async ({ page }) => {
  test.slow(); // triple the default timeout

  // Stop any existing test db to ensure clean state
  if (!process.env.CI) {
    try { 
      execSync('docker compose -f docker-compose.test.yml down -v', { stdio: 'inherit' });
    } catch (error) {
      // Ignore errors if no existing container
    }
    
    // Start test db
    execSync('docker compose -f docker-compose.test.yml up -d', { stdio: 'inherit' });
    
    // Optional: Wait for database to be ready
    console.log('Waiting for database to be ready');
    execSync('sleep 5', { stdio: 'inherit' });
    
    // local dev, need to use .env.test.local
    execSync('pnpm exec dotenv -e .env.test.local node ./setup-database.js && pnpm exec dotenv -e .env.test.local node ./initialize.js', { stdio: 'inherit' });
  } else {
    console.log('CI environment detected');
    // we are in CI uiing the preview deployment
    // sign in and reset database
    await page.goto("/");  // base url is set in playwright.config.ts
    await expect(page).toHaveURL(/\/signin/);

    // sign in using credentials
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Administrator1!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    console.log('✅ Signed in successfully');

    // go to /settings
    await page.goto("/dashboard/settings");
    // click "reset all app data" button
    const resetButton = page.getByRole('button', { name: 'Reset all app data' });
    await resetButton.click({ timeout: 10000 });
    const confirmButton = page.getByRole('button', { name: 'Delete all data' });
    await confirmButton.click({ timeout: 10000 });

    await expect(page).toHaveURL(/\/setup/, { timeout: 10000 });

    console.log('✅ Reset app data with settings button')

  }

  // STEP 1
  await page.goto("/setup");
  // screenshot
  await page.fill('input[name="username"]', 'admin', { timeout: 5000 });
  await page.fill('input[name="password"]', 'Administrator1!', { timeout: 5000 });

  await page.fill('input[name="confirmPassword"]', 'Administrator1!', { timeout: 5000 });
  await page.click('button[type="submit"]', { timeout: 10000 });
  await expect(page).toHaveURL(/\/setup\?step=2/);
  console.log('✅ Step 1 completed: admin user created');

  // STEP 2
  // env var cannot be UPLOADTHING_TOKEN or this step will be skipped
  // screenshot
  await page.fill('input[name="uploadThingToken"]', process.env.UPLOADTHING_TOKEN ?? '', { timeout: 5000 });
  await page.click('button[type="submit"]', { timeout: 10000 });

  await expect(page).toHaveURL(/\/setup\?step=3/, { timeout: 20000 });
  console.log('✅ Step 2 completed: uploadthing token set');

  // STEP 3
  const protocolHandle = page.locator('input[type="file"]');
  await protocolHandle.setInputFiles('e2e/files/SampleProtocol.netcanvas');
  // check for uploading assets toast
  await expect(page.getByText('Uploading assets...')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Uploading assets...')).not.toBeVisible({ timeout: 120000 }); // long process if assets are large
  await expect(page.getByText('Complete...')).toBeVisible({ timeout: 60000 });

  await page.getByRole('button', { name: 'Continue' }).click({ timeout: 5000 });
  await expect(page).toHaveURL(/\/setup\?step=4/);
  console.log('✅ Step 3 completed: protocol uploaded');

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
  await anonymousRecruitmentSwitch.click({ timeout: 10000 });
  await limitInterviewsSwitch.click({ timeout: 10000 });


  await expect(anonymousRecruitmentSwitch).toBeChecked();
  await expect(limitInterviewsSwitch).toBeChecked();

  await page.getByRole('button', { name: 'Continue' }).click({ timeout: 10000 });
  await expect(page).toHaveURL(/\/setup\?step=5/);
  console.log('✅ Step 4 completed: participants imported and settings toggled');

  // STEP 5 - documentation
  await page.getByRole('button', { name: 'Go to the dashboard!' }).click({ timeout: 10000 });
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  console.log('✅ Setup completed: dashboard reached');
});
