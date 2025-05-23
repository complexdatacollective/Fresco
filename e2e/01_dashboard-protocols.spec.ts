/* eslint-disable no-console */

import { expect, test } from '@playwright/test';

test.describe('Protocols page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/protocols');
  });

  test('should display uploaded protocol', async ({ page }) => {
    // check that our uploaded protocol is visible
    await expect(page.locator('text=E2EProtocol.netcanvas')).toHaveText(
      'E2EProtocol.netcanvas',
    );
  });

  test('should match visual snapshot', async ({ page }) => {
    await page.waitForTimeout(2000); // let table load
    await expect.soft(page).toHaveScreenshot('protocols-page.png', {
      mask: [
        // mask the imported & modified timestamps
        page.getByTestId('protocol-imported-at'),
        page.getByTestId('protocol-last-modified'),
      ],
    });
  });

  test('should upload new protocol', async ({ page }) => {
    const protocolHandle = page.locator('input[type="file"]');
    await protocolHandle.setInputFiles('e2e/files/SmallProtocol.netcanvas');
    await expect(page.getByTestId('job-card-Complete')).toBeVisible();
  });

  test('should delete protocol', async ({ page }) => {
    await page.getByTestId('actions-dropdown-protocols').nth(1).click();
    await page.getByTestId('delete-protocol').click();
    await page.getByTestId('confirm-delete-protocols-button').click();

    // Verify the protocol is no longer in the table
    await expect(page.getByText('SmallProtocol.netcanvas')).not.toBeVisible();
  });
});
