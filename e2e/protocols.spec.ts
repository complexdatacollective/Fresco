import { expect, test } from '@playwright/test';

test.describe('Protocols page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/protocols');
  });

  test('should display uploaded protocol', async ({ page }) => {
    // check that our uploaded protocol is visible
    await expect(page.locator('text=SampleProtocol.netcanvas')).toHaveText(
      'SampleProtocol.netcanvas',
    );
  });

  test('should match visual snapshot', async ({ page }) => {
    // validate screenshot
    await expect.soft(page).toHaveScreenshot('protocols-page.png');
  });

  test.fixme('should upload new protocol', async ({ page }) => {
    const protocolHandle = page.locator('input[type="file"]');
    await protocolHandle.setInputFiles('e2e/files/E2E.netcanvas');
    await expect(page.getByText('Extracting protocol')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('Complete...')).toBeVisible({ timeout: 20000 });
  });

  test.fixme('should delete protocol', async ({ page }) => {
    // find the table row with the protocol we want to delete
    await page
      .getByRole('row', { name: 'Select row Protocol icon E2E.' })
      .first()
      .getByLabel('Select row')
      .click();
    await page.getByRole('button', { name: 'Delete Selected' }).click();
    await page.getByRole('button', { name: 'Permanently Delete' }).click();

    // Verify the protocol is no longer in the table
    await expect(page.locator('text=E2E.netcanvas')).not.toBeVisible({
      timeout: 5000,
    });
  });
});
