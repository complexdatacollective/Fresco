// must come after protocols tests so that the interview is available
import { expect, test } from '@playwright/test';

test.describe('Interviews page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/interviews');
  });

  test('should display completed interview', async ({ page }) => {
    // check that our completed interview is visible
    await expect(page.getByText('E2EProtocol.netcanvas')).toBeVisible();
  });

  // export interview data
  test('should export interview data', async ({ page }) => {
    await page.getByTestId('export-interviews-button').click();
    await page.getByTestId('export-all-button').click();
    await expect(page.getByTestId('confirm-export-dialog-title')).toBeVisible();
    // expect all three export options
    await expect(page.getByTestId('export-graphml-switch')).toBeVisible();
    await expect(page.getByTestId('export-csv-switch')).toBeVisible();
    await expect(
      page.getByTestId('export-screen-layout-coordinates-switch'),
    ).toBeVisible();
    // todo: verify they are the default values
    await page.getByTestId('start-export-button').click();
    await expect(page.getByTestId('exporting-loading-dialog')).toBeVisible();
  });

  test('should export incomplete interview urls', async ({ page }) => {
    await page.getByTestId('export-incomplete-interview-urls-button').click();
    await page.getByTestId('select-protocol').click();
    await page.getByTestId('select-protocol-item').first().click();
    await page.getByTestId('confirm-export-incomplete-urls-button').click();
    await expect(page.getByTestId('toast-success')).toBeVisible();
  });
});
