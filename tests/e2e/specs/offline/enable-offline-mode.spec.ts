import { expect, test } from '../../fixtures/test.js';
import { waitForDialog } from '../../helpers/dialog.js';
import { getFirstRow, openRowActions } from '../../helpers/row-actions.js';
import { waitForTable } from '../../helpers/table.js';

test.describe('Enable Offline Mode', () => {
  test.beforeAll(async ({ database }) => {
    await database.restoreSnapshot();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/settings');
  });

  test.describe('Read-only', () => {
    test.afterAll(async ({ database }) => {
      await database.releaseReadLock();
    });

    test('displays offline mode section', async ({ page }) => {
      await expect(page.getByTestId('offline-mode-card')).toBeVisible();
    });

    test('offline mode toggle is visible', async ({ page }) => {
      await expect(page.getByTestId('offline-mode-field')).toBeVisible();
    });

    test('offline mode toggle has switch control', async ({ page }) => {
      const toggle = page.getByTestId('offline-mode-field').getByRole('switch');
      await expect(toggle).toBeVisible();
    });

    test('storage usage section is visible', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /storage usage/i }),
      ).toBeVisible();
    });

    test('visual snapshot of offline mode section', async ({
      page,
      captureElement,
    }) => {
      const offlineCard = page.getByTestId('offline-mode-card');
      await captureElement(offlineCard, 'offline-mode-settings-card');
    });
  });

  test.describe('Mutations', () => {
    test.describe.configure({ mode: 'serial' });

    test('enable offline mode toggle', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        const toggle = page
          .getByTestId('offline-mode-field')
          .getByRole('switch');
        const initialState = await toggle.isChecked();

        await toggle.click();

        await page.waitForTimeout(500);

        const offlineModeEnabled = await page.evaluate(() => {
          return localStorage.getItem('offlineModeEnabled');
        });

        expect(offlineModeEnabled).toBe((!initialState).toString());

        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        const reloadedToggle = page
          .getByTestId('offline-mode-field')
          .getByRole('switch');
        const newState = await reloadedToggle.isChecked();
        expect(newState).toBe(!initialState);
      } finally {
        await cleanup();
      }
    });

    test('download protocol for offline use', async ({ page, database }) => {
      const cleanup = await database.isolate(page);
      try {
        const toggle = page
          .getByTestId('offline-mode-field')
          .getByRole('switch');

        if (!(await toggle.isChecked())) {
          await toggle.click();
          await page.waitForTimeout(500);
        }

        await page.goto('/dashboard/protocols');
        await waitForTable(page, { minRows: 1 });

        const row = getFirstRow(page);
        await openRowActions(row);

        const enableOfflineMenuItem = page.getByRole('menuitem', {
          name: /enable offline/i,
        });
        await expect(enableOfflineMenuItem).toBeVisible();
        await enableOfflineMenuItem.click();

        const downloadDialog = await waitForDialog(page);
        await expect(
          downloadDialog.getByRole('heading', {
            name: /downloading protocol assets/i,
          }),
        ).toBeVisible();

        await page.waitForTimeout(3000);

        await expect(downloadDialog).not.toBeVisible({ timeout: 30000 });

        await page.waitForTimeout(1000);
      } finally {
        await cleanup();
      }
    });

    test('visual: download progress dialog', async ({
      page,
      database,
      captureElement,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        const toggle = page
          .getByTestId('offline-mode-field')
          .getByRole('switch');

        if (!(await toggle.isChecked())) {
          await toggle.click();
          await page.waitForTimeout(500);
        }

        await page.goto('/dashboard/protocols');
        await waitForTable(page, { minRows: 1 });

        const row = getFirstRow(page);
        await openRowActions(row);

        await page.getByRole('menuitem', { name: /enable offline/i }).click();

        const downloadDialog = await waitForDialog(page);
        await page.waitForTimeout(1000);

        await captureElement(
          downloadDialog,
          'offline-download-progress-dialog',
        );
      } finally {
        await cleanup();
      }
    });

    test('verify offline badge appears after download', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        const toggle = page
          .getByTestId('offline-mode-field')
          .getByRole('switch');

        if (!(await toggle.isChecked())) {
          await toggle.click();
          await page.waitForTimeout(500);
        }

        await page.goto('/dashboard/protocols');
        await waitForTable(page, { minRows: 1 });

        const row = getFirstRow(page);
        await openRowActions(row);
        await page.getByRole('menuitem', { name: /enable offline/i }).click();

        const downloadDialog = await waitForDialog(page);
        await expect(downloadDialog).not.toBeVisible({ timeout: 30000 });

        await page.waitForTimeout(1000);
        await page.reload();
        await waitForTable(page, { minRows: 1 });

        await expect(
          page.getByRole('cell', { name: /available offline/i }),
        ).toBeVisible();
      } finally {
        await cleanup();
      }
    });
  });
});
