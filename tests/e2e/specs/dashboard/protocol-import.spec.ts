import path from 'node:path';
import { expect, test } from '../../fixtures/test.js';
import { waitForTable, getTableRowCount } from '../../helpers/table.js';
import { mockUploadThing } from '../../helpers/uploadthing-mock.js';

const DATA_DIR = path.join(import.meta.dirname, '../../data');

test.describe('Protocol Import', () => {
  test.beforeAll(async ({ database }) => {
    await database.restoreSnapshot();
  });

  test.describe('Mutations', () => {
    test.describe.configure({ mode: 'serial' });

    test('import Development.netcanvas successfully', async ({
      page,
      database,
    }) => {
      test.setTimeout(120_000);
      const cleanup = await database.isolate(page);
      try {
        await mockUploadThing(page);
        await page.goto('/dashboard/protocols');
        await waitForTable(page, { minRows: 1 });

        const initialCount = await getTableRowCount(page);

        // Open import popover and upload file
        await page.getByRole('button', { name: /import protocols/i }).click();
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
          path.join(DATA_DIR, 'Development.netcanvas'),
        );

        // Wait for success toast (Toast.Root renders as role="dialog")
        const successToast = page.locator(
          'div[role="dialog"][data-type="success"]',
        );
        await expect(successToast).toBeVisible({ timeout: 30_000 });

        // Wait for toast to auto-close then reload to pick up revalidated cache
        await expect(successToast).toBeHidden({ timeout: 10_000 });
        await page.reload();
        await waitForTable(page, { minRows: 1 });

        // Verify protocol appears in table
        const newCount = await getTableRowCount(page);
        expect(newCount).toBe(initialCount + 1);

        await expect(
          page.getByRole('cell', { name: 'Development.netcanvas' }),
        ).toBeVisible();
      } finally {
        await cleanup();
      }
    });

    test('error: upload invalid ZIP file', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.goto('/dashboard/protocols');
        await waitForTable(page, { minRows: 1 });

        await page.getByRole('button', { name: /import protocols/i }).click();
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
          path.join(DATA_DIR, 'not-a-zip.netcanvas'),
        );

        // Wait for error toast
        const errorToast = page.locator(
          'div[role="dialog"][data-type="destructive"]',
        );
        await expect(errorToast).toBeVisible({ timeout: 15_000 });

        // Verify retry button is present
        await expect(
          errorToast.getByRole('button', { name: /retry/i }),
        ).toBeVisible();
      } finally {
        await cleanup();
      }
    });

    test('error: upload ZIP without protocol.json', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.goto('/dashboard/protocols');
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
      } finally {
        await cleanup();
      }
    });

    test('error: upload unsupported schema version', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.goto('/dashboard/protocols');
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
      } finally {
        await cleanup();
      }
    });

    test('error: duplicate protocol import', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        await mockUploadThing(page);
        await page.goto('/dashboard/protocols');
        await waitForTable(page, { minRows: 1 });

        // First import should succeed
        await page.getByRole('button', { name: /import protocols/i }).click();
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(
          path.join(DATA_DIR, 'Development.netcanvas'),
        );

        const successToast = page.locator(
          'div[role="dialog"][data-type="success"]',
        );
        await expect(successToast).toBeVisible({ timeout: 30_000 });

        // Reload to get clean React state for second import
        await page.reload();
        await waitForTable(page, { minRows: 1 });

        // Second import should fail with duplicate error
        await page.getByRole('button', { name: /import protocols/i }).click();
        await expect(
          page.getByRole('button', { name: /browse files/i }),
        ).toBeVisible();
        const fileInput2 = page.locator('input[type="file"]');
        await fileInput2.setInputFiles(
          path.join(DATA_DIR, 'Development.netcanvas'),
        );

        const errorToast = page.locator(
          'div[role="dialog"][data-type="destructive"]',
        );
        await expect(errorToast).toBeVisible({ timeout: 30_000 });
      } finally {
        await cleanup();
      }
    });
  });
});
