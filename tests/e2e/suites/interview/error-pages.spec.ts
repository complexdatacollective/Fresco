import { type Page } from '@playwright/test';
import { expect, test } from '../../fixtures/fixtures';

async function completeInterview(page: Page): Promise<void> {
  const maxStages = 10;

  for (let i = 0; i < maxStages; i++) {
    if (page.url().includes('/interview/finished')) {
      return;
    }

    // Check if the FinishSession stage is showing
    const finishButton = page.getByRole('button', { name: /^finish$/i });
    if (await finishButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await finishButton.click();

      const confirmButton = page.getByRole('button', {
        name: /finish interview/i,
      });
      await expect(confirmButton).toBeVisible({ timeout: 5000 });
      await confirmButton.click();

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
      await page.waitForTimeout(500);
    }
  }
}

test.describe('Interview Error Pages', () => {
  test('should display error page at /onboard/error', async ({ page }) => {
    await page.goto('/onboard/error', { waitUntil: 'domcontentloaded' });

    // Should display error message
    await expect(
      page.getByText(/something went wrong during onboarding/i),
    ).toBeVisible({ timeout: 10000 });

    // Should provide contact guidance
    await expect(
      page.getByText(/contact the person who recruited you/i),
    ).toBeVisible();
  });

  test('should display no-anonymous-recruitment page when disabled', async ({
    page,
  }) => {
    // This test needs the setup context where anonymous recruitment is disabled
    // The setup context has configured: false, so anonymous recruitment defaults to disabled

    await page.goto('/onboard/no-anonymous-recruitment', {
      waitUntil: 'domcontentloaded',
    });

    // Should display anonymous recruitment disabled message
    await expect(page.getByText(/anonymous recruitment disabled/i)).toBeVisible(
      { timeout: 10000 },
    );

    // Should explain that researchers can enable it
    await expect(
      page.getByText(/researchers may optionally enable/i),
    ).toBeVisible();
  });

  test('should redirect to error page for invalid protocol ID', async ({
    page,
  }) => {
    // Try to access a non-existent protocol
    const invalidProtocolId = 'invalid-protocol-12345';

    await page.goto(`/onboard/${invalidProtocolId}`, {
      waitUntil: 'domcontentloaded',
    });

    // Should be redirected to error page or show error
    // Wait for the page to settle
    await page.waitForTimeout(2000);

    // Either redirected to error page or showing error content
    const url = page.url();
    const isErrorPage = url.includes('/onboard/error');
    const hasErrorContent = await page
      .getByText(/something went wrong|error|not found/i)
      .isVisible()
      .catch(() => false);

    expect(isErrorPage || hasErrorContent).toBeTruthy();
  });

  test('should handle direct access to non-existent interview', async ({
    page,
  }) => {
    // Try to access a non-existent interview ID
    const nonExistentId = 'non-existent-interview-12345';

    await page.goto(`/interview/${nonExistentId}`, {
      waitUntil: 'domcontentloaded',
    });

    // Should show error or redirect
    await page.waitForTimeout(2000);

    // Check for error state
    const url = page.url();
    const isErrorPage =
      url.includes('/error') ||
      url.includes('/404') ||
      url.includes('/not-found');
    const hasErrorContent = await page
      .getByText(/not found|error|does not exist/i)
      .isVisible()
      .catch(() => false);

    expect(isErrorPage || hasErrorContent).toBeTruthy();
  });
});

test.describe.serial('Interview Error Handling - Serial', () => {
  test('should redirect to finished page when interview limit reached', async ({
    page,
    database,
  }) => {
    test.setTimeout(60000);

    const cleanup = await database.isolate('interview-limit');

    try {
      // Enable limit interviews setting
      await database.prisma.appSettings.upsert({
        where: { key: 'limitInterviews' },
        update: { value: 'true' },
        create: { key: 'limitInterviews', value: 'true' },
      });

      const protocolId = database.testData?.protocol.id;
      if (!protocolId) {
        throw new Error('Test data not found');
      }

      // First, complete an interview to set the cookie
      await page.goto(`/onboard/${protocolId}`, {
        waitUntil: 'domcontentloaded',
      });

      // Wait for interview to start
      await page.waitForURL(/\/interview\//, { timeout: 15000 });

      await completeInterview(page);

      await expect(page).toHaveURL(/\/interview\/finished/);

      // Now try to start a new interview - should redirect to finished
      await page.goto(`/onboard/${protocolId}`, {
        waitUntil: 'domcontentloaded',
      });

      // Should be redirected to finished page
      await expect(page).toHaveURL(/\/interview\/finished/, { timeout: 10000 });
    } finally {
      await cleanup();
    }
  });
});
