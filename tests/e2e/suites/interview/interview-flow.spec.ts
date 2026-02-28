import { type Page } from '@playwright/test';
import { expect, test } from '../../fixtures/fixtures';

/**
 * Navigate through all interview stages and complete the interview.
 * The test protocol has 2 stages + an auto-appended FinishSession stage.
 * On the FinishSession stage, a "Finish" button appears in the content area
 * which opens a confirmation dialog.
 */
async function completeInterview(page: Page): Promise<void> {
  const maxStages = 10;

  for (let i = 0; i < maxStages; i++) {
    // Check if we've reached the finished page
    if (page.url().includes('/interview/finished')) {
      return;
    }

    // Check if the FinishSession stage is showing (has a "Finish" button in content)
    const finishButton = page.getByRole('button', { name: /^finish$/i });
    if (await finishButton.isVisible({ timeout: 500 }).catch(() => false)) {
      // Click the Finish button to open confirmation dialog
      await finishButton.click();

      // Confirm the dialog
      const confirmButton = page.getByRole('button', {
        name: /finish interview/i,
      });
      await expect(confirmButton).toBeVisible({ timeout: 5000 });
      await confirmButton.click();

      // Wait for redirect to finished page
      await page.waitForURL(/\/interview\/finished/, { timeout: 15000 });
      return;
    }

    // Try clicking the Next Step button
    const nextButton = page.getByRole('button', { name: /next step/i });
    if (
      (await nextButton.isVisible({ timeout: 500 }).catch(() => false)) &&
      (await nextButton.isEnabled())
    ) {
      await nextButton.click();
      await page.waitForTimeout(500);
    } else {
      // Wait and try again
      await page.waitForTimeout(500);
    }
  }
}

test.describe.serial('Interview Stage Navigation', () => {
  test('should display interview interface on start', async ({
    page,
    database,
  }) => {
    const protocolId = database.testData?.protocol.id;
    if (!protocolId) {
      throw new Error('Test data not found. Ensure global setup has run.');
    }

    await database.withSnapshot('display-interview', async () => {
      const participantIdentifier = `FLOW-DISPLAY-${Date.now()}`;

      await page.goto(
        `/onboard/${protocolId}?participantIdentifier=${participantIdentifier}`,
        { waitUntil: 'domcontentloaded' },
      );

      // Wait for interview page to load
      await page.waitForURL(/\/interview\/[a-z0-9-]+/, { timeout: 15000 });

      // Verify navigation is visible
      const navigation = page.getByRole('navigation');
      await expect(navigation).toBeVisible({ timeout: 10000 });

      // Verify navigation buttons are present
      const nextButton = page.getByRole('button', { name: /next step/i });
      await expect(nextButton).toBeVisible();

      const prevButton = page.getByRole('button', { name: /previous step/i });
      await expect(prevButton).toBeVisible();
    });
  });

  test('should navigate forward to next stage', async ({ page, database }) => {
    const protocolId = database.testData?.protocol.id;
    if (!protocolId) {
      throw new Error('Test data not found. Ensure global setup has run.');
    }

    await database.withSnapshot('navigate-forward', async () => {
      const participantIdentifier = `FLOW-FORWARD-${Date.now()}`;

      await page.goto(
        `/onboard/${protocolId}?participantIdentifier=${participantIdentifier}`,
        { waitUntil: 'domcontentloaded' },
      );

      // Wait for interview page to load
      await page.waitForURL(/\/interview\/[a-z0-9-]+/, { timeout: 15000 });

      // Click next step button
      const nextButton = page.getByRole('button', { name: /next step/i });
      await expect(nextButton).toBeVisible({ timeout: 10000 });
      await expect(nextButton).toBeEnabled();
      await nextButton.click();

      // Wait for navigation animation
      await page.waitForTimeout(1000);

      // URL should change to include ?step=1 or higher
      await expect(page).toHaveURL(/step=[1-9]/, { timeout: 5000 });
    });
  });

  test('should navigate backward to previous stage', async ({
    page,
    database,
  }) => {
    const protocolId = database.testData?.protocol.id;
    if (!protocolId) {
      throw new Error('Test data not found. Ensure global setup has run.');
    }

    await database.withSnapshot('navigate-backward', async () => {
      const participantIdentifier = `FLOW-BACKWARD-${Date.now()}`;

      // Start at step 1
      await page.goto(
        `/onboard/${protocolId}?participantIdentifier=${participantIdentifier}`,
        { waitUntil: 'domcontentloaded' },
      );

      await page.waitForURL(/\/interview\/[a-z0-9-]+/, { timeout: 15000 });

      // Move forward first
      const nextButton = page.getByRole('button', { name: /next step/i });
      await expect(nextButton).toBeVisible({ timeout: 10000 });
      await expect(nextButton).toBeEnabled();
      await nextButton.click();
      await page.waitForTimeout(1000);

      // Verify we moved forward
      await expect(page).toHaveURL(/step=[1-9]/, { timeout: 5000 });

      // Now go back
      const prevButton = page.getByRole('button', { name: /previous step/i });
      await expect(prevButton).toBeEnabled();
      await prevButton.click();
      await page.waitForTimeout(1000);

      // Should be back at step 0
      await expect(page).toHaveURL(/step=0/, { timeout: 5000 });
    });
  });

  test('should display progress indicator', async ({ page, database }) => {
    const protocolId = database.testData?.protocol.id;
    if (!protocolId) {
      throw new Error('Test data not found. Ensure global setup has run.');
    }

    await database.withSnapshot('progress-indicator', async () => {
      const participantIdentifier = `FLOW-PROGRESS-${Date.now()}`;

      await page.goto(
        `/onboard/${protocolId}?participantIdentifier=${participantIdentifier}`,
        { waitUntil: 'domcontentloaded' },
      );

      await page.waitForURL(/\/interview\/[a-z0-9-]+/, { timeout: 15000 });

      // Wait for navigation to be visible
      const navigation = page.getByRole('navigation');
      await expect(navigation).toBeVisible({ timeout: 10000 });

      // Progress bar should be present in the navigation area
      // The progress bar component renders as a styled div with a progress fill
      const progressContainer = navigation.locator('.flex.grow');
      await expect(progressContainer).toBeVisible();
    });
  });

  test('should persist stage position across page reload', async ({
    page,
    database,
  }) => {
    const protocolId = database.testData?.protocol.id;
    if (!protocolId) {
      throw new Error('Test data not found. Ensure global setup has run.');
    }

    await database.withSnapshot('persist-position', async () => {
      const participantIdentifier = `FLOW-PERSIST-${Date.now()}`;

      await page.goto(
        `/onboard/${protocolId}?participantIdentifier=${participantIdentifier}`,
        { waitUntil: 'domcontentloaded' },
      );

      await page.waitForURL(/\/interview\/[a-z0-9-]+/, { timeout: 15000 });

      // Move forward
      const nextButton = page.getByRole('button', { name: /next step/i });
      await expect(nextButton).toBeVisible({ timeout: 10000 });
      await expect(nextButton).toBeEnabled();
      await nextButton.click();
      await page.waitForTimeout(1000);

      // Wait for URL to update
      await expect(page).toHaveURL(/step=[1-9]/, { timeout: 5000 });

      // Extract the step from URL
      const stepMatch = /step=(\d+)/.exec(page.url());
      const currentStep = stepMatch ? stepMatch[1] : '1';

      // Reload the page
      await page.reload({ waitUntil: 'domcontentloaded' });

      // Verify we're still on the same step
      await expect(page).toHaveURL(new RegExp(`step=${currentStep}`), {
        timeout: 5000,
      });
    });
  });
});

test.describe.serial('Interview Navigation - Edge Cases', () => {
  test('previous button should be disabled on first stage', async ({
    page,
    database,
  }) => {
    const protocolId = database.testData?.protocol.id;
    if (!protocolId) {
      throw new Error('Test data not found. Ensure global setup has run.');
    }

    await database.withSnapshot('first-stage-disabled', async () => {
      const participantIdentifier = `FLOW-FIRST-${Date.now()}`;

      await page.goto(
        `/onboard/${protocolId}?participantIdentifier=${participantIdentifier}`,
        { waitUntil: 'domcontentloaded' },
      );

      await page.waitForURL(/\/interview\/[a-z0-9-]+/, { timeout: 15000 });

      // Wait for navigation to be visible
      const navigation = page.getByRole('navigation');
      await expect(navigation).toBeVisible({ timeout: 10000 });

      // Previous button should be disabled on first stage
      const prevButton = page.getByRole('button', { name: /previous step/i });
      await expect(prevButton).toBeDisabled();
    });
  });

  test('interview URL should be accessible directly', async ({
    page,
    database,
  }) => {
    const testData = database.testData;
    if (!testData) {
      throw new Error('Test data not found. Ensure global setup has run.');
    }

    // Use an existing interview from test data (one that's in progress)
    const existingInterview = await database.prisma.interview.findFirst({
      where: {
        protocolId: testData.protocol.id,
        finishTime: null, // Not completed
      },
    });

    if (!existingInterview) {
      throw new Error('No in-progress interview found in test data');
    }

    // Navigate directly to the interview URL
    await page.goto(`/interview/${existingInterview.id}`, {
      waitUntil: 'domcontentloaded',
    });

    // Should show the interview interface
    const navigation = page.getByRole('navigation');
    await expect(navigation).toBeVisible({ timeout: 10000 });
  });
});

test.describe.serial('Interview Completion', () => {
  test('should redirect to finished page after completing all stages', async ({
    page,
    database,
  }) => {
    test.setTimeout(60000);

    const protocolId = database.testData?.protocol.id;
    if (!protocolId) {
      throw new Error('Test data not found. Ensure global setup has run.');
    }

    await database.withSnapshot('complete-interview', async () => {
      const participantIdentifier = `FLOW-COMPLETE-${Date.now()}`;

      await page.goto(
        `/onboard/${protocolId}?participantIdentifier=${participantIdentifier}`,
        { waitUntil: 'domcontentloaded' },
      );

      await page.waitForURL(/\/interview\/[a-z0-9-]+/, { timeout: 15000 });

      await completeInterview(page);

      await expect(page).toHaveURL(/\/interview\/finished/);
    });
  });

  test('finished page should display completion message', async ({
    page,
    database,
  }) => {
    test.setTimeout(60000);

    const protocolId = database.testData?.protocol.id;
    if (!protocolId) {
      throw new Error('Test data not found. Ensure global setup has run.');
    }

    await database.withSnapshot('finished-page', async () => {
      const participantIdentifier = `FLOW-FINISHED-${Date.now()}`;

      await page.goto(
        `/onboard/${protocolId}?participantIdentifier=${participantIdentifier}`,
        { waitUntil: 'domcontentloaded' },
      );

      await page.waitForURL(/\/interview\/[a-z0-9-]+/, { timeout: 15000 });

      await completeInterview(page);

      // Should display a completion message
      const bodyText = await page.locator('body').textContent();
      const text = bodyText?.toLowerCase() ?? '';
      expect(
        text.includes('complete') ||
          text.includes('finished') ||
          text.includes('thank'),
      ).toBeTruthy();
    });
  });

  test('completed interview should have finishTime set', async ({
    page,
    database,
  }) => {
    test.setTimeout(60000);

    const protocolId = database.testData?.protocol.id;
    if (!protocolId) {
      throw new Error('Test data not found. Ensure global setup has run.');
    }

    await database.withSnapshot('finish-time', async () => {
      const participantIdentifier = `FLOW-FINISHTIME-${Date.now()}`;

      // First, create the interview
      await page.goto(
        `/onboard/${protocolId}?participantIdentifier=${participantIdentifier}`,
        { waitUntil: 'domcontentloaded' },
      );

      await page.waitForURL(/\/interview\/[a-z0-9-]+/, { timeout: 15000 });

      // Extract interview ID from URL
      const urlMatch = /\/interview\/([a-z0-9-]+)/.exec(page.url());
      const interviewId = urlMatch?.[1];
      expect(interviewId).toBeTruthy();

      await completeInterview(page);

      // Verify finishTime is set in database
      const interview = await database.prisma.interview.findUnique({
        where: { id: interviewId },
      });

      expect(interview?.finishTime).not.toBeNull();
    });
  });
});
