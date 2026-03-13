import path from 'node:path';
import { expect, test } from '../../fixtures/test.js';
import { waitForTable } from '../../helpers/table.js';

const DATA_DIR = path.join(import.meta.dirname, '../../data');

test.describe('Protocol Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/protocols');
  });

  test('error: upload invalid ZIP file', async ({ page }) => {
    await waitForTable(page, { minRows: 1 });

    await page.getByRole('button', { name: /import protocols/i }).click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(DATA_DIR, 'not-a-zip.netcanvas'));

    // Wait for error toast
    const errorToast = page.locator(
      'div[role="dialog"][data-type="destructive"]',
    );
    await expect(errorToast).toBeVisible({ timeout: 15_000 });

    // Verify retry button is present
    await expect(
      errorToast.getByRole('button', { name: /retry/i }),
    ).toBeVisible();
  });

  test('error: upload ZIP without protocol.json', async ({ page }) => {
    await waitForTable(page, { minRows: 1 });

    await page.getByRole('button', { name: /import protocols/i }).click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(
      path.join(DATA_DIR, 'missing-protocol-json.netcanvas'),
    );

    const errorToast = page.locator(
      'div[role="dialog"][data-type="destructive"]',
    );
    await expect(errorToast).toBeVisible({ timeout: 15_000 });

    await expect(
      errorToast.getByRole('button', { name: /retry/i }),
    ).toBeVisible();
  });

  test('error: upload unsupported schema version', async ({ page }) => {
    await waitForTable(page, { minRows: 1 });

    await page.getByRole('button', { name: /import protocols/i }).click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(
      path.join(DATA_DIR, 'invalid-schema.netcanvas'),
    );

    const errorToast = page.locator(
      'div[role="dialog"][data-type="destructive"]',
    );
    await expect(errorToast).toBeVisible({ timeout: 15_000 });

    await expect(
      errorToast.getByRole('button', { name: /retry/i }),
    ).toBeVisible();
  });
});
