/* eslint-disable no-console */
/* eslint-disable no-process-env */

import { expect, test } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, '../e2e/.auth/user.json');
test('create test database and setup app', async ({
  playwright,
  page,
  baseURL,
}) => {
  console.log('🚀 Starting setup test', baseURL);

  // Stop any existing test db to ensure clean state
  if (!process.env.CI) {
    console.log('Local environment detected');
    try {
      execSync('docker compose -f docker-compose.test.yml down -v', {
        stdio: 'inherit',
      });
    } catch (error) {
      // Ignore errors if no existing container
    }

    // Start test db
    execSync('docker compose -f docker-compose.test.yml up -d', {
      stdio: 'inherit',
    });

    // Optional: Wait for database to be ready
    console.log('Waiting for database to be ready');
    execSync('sleep 5', { stdio: 'inherit' });

    // local dev, need to use .env.test.local
    execSync(
      'pnpm exec dotenv -e .env.test.local node ./setup-database.js && pnpm exec dotenv -e .env.test.local node ./initialize.js',
      { stdio: 'inherit' },
    );
  } else {
    console.log('CI environment detected');
    console.log('🚮 Clearing cache');
    const requestContext = await playwright.request.newContext({
      baseURL,
    });
    // Call the reset endpoint
    try {
      await requestContext.get('/reset');
      console.log('✅ Application cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }

    await requestContext.dispose();
    // we are in CI using the preview deployment
    // sign in and reset database
    await page.goto('/'); // base url is set in playwright.config.ts
    await expect(page).toHaveURL(/\/signin/);

    // sign in using credentials
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Administrator1!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
    console.log('✅ Signed in successfully');

    // go to /settings
    await page.goto('/dashboard/settings');
    // click "reset all app data" button
    await page.getByTestId('reset-app-button').click();
    await page.getByTestId('confirm-reset-app-button').click();
    await expect(page).toHaveURL(/\/setup/);

    console.log('✅ Reset app data with settings button');
  }

  // STEP 1
  await page.goto('/setup');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'Administrator1!');

  await page.fill('input[name="confirmPassword"]', 'Administrator1!');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/setup\?step=2/);
  console.log('✅ Step 1 completed: admin user created');

  // STEP 2
  // env var cannot be UPLOADTHING_TOKEN or this step will be skipped
  await page.fill(
    'input[name="uploadThingToken"]',
    process.env.E2E_UPLOADTHING_TOKEN ?? '',
  );
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/setup\?step=3/);
  console.log('✅ Step 2 completed: uploadthing token set');

  // STEP 3
  const protocolHandle = page.locator('input[type="file"]');
  await protocolHandle.setInputFiles('e2e/files/SampleProtocol.netcanvas');
  // check for uploading assets toast
  await expect(page.getByTestId('job-card-Uploading assets')).toBeVisible();
  await expect(page.getByTestId('job-card-Uploading assets')).not.toBeVisible();
  await expect(page.getByTestId('job-card-Complete')).toBeVisible();

  await page.getByTestId('upload-protocol-continue-button').click();
  await expect(page).toHaveURL(/\/setup\?step=4/);
  console.log('✅ Step 3 completed: protocol uploaded');

  // STEP 4
  // import participants
  await page.getByTestId('import-participants-button').click();

  // dialog should be visible
  await expect(page.getByRole('dialog')).toBeVisible();

  const participantsHandle = page.locator('input[type="file"]');
  await participantsHandle.setInputFiles('e2e/files/participants.csv');
  await page.getByTestId('import-participants-submit').click();

  // participants imported toast
  await expect(
    page.locator('div.text-sm.opacity-90', {
      hasText: 'Participants have been imported successfully',
    }),
  ).toBeVisible();

  // toggle switches
  const anonymousRecruitmentSwitch = page.getByRole('switch').first();
  const limitInterviewsSwitch = page.getByRole('switch').last();
  await anonymousRecruitmentSwitch.click();
  await limitInterviewsSwitch.click();

  await expect(anonymousRecruitmentSwitch).toBeChecked();
  await expect(limitInterviewsSwitch).toBeChecked();

  await page.getByTestId('onboard-continue-button').click();
  await expect(page).toHaveURL(/\/setup\?step=5/);
  console.log(
    '✅ Step 4 completed: participants imported and settings toggled',
  );

  // STEP 5 - documentation
  await page.getByTestId('go-to-dashboard-button').click();
  await expect(page).toHaveURL(/\/dashboard/);
  console.log('✅ Setup completed: dashboard reached');

  // save auth state for usage in other tests
  await page.context().storageState({ path: authFile });
});
