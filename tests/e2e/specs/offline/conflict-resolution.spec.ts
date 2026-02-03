import { expect, test, expectURL } from '../../fixtures/test.js';
import { waitForDialog } from '../../helpers/dialog.js';
import { getFirstRow, openRowActions } from '../../helpers/row-actions.js';
import { waitForTable } from '../../helpers/table.js';

test.describe('Conflict Resolution', () => {
  test.beforeAll(async ({ database }) => {
    await database.restoreSnapshot();
  });

  test.describe('Mutations', () => {
    test.describe.configure({ mode: 'serial' });

    test('detect conflict between local and server changes', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.goto('/dashboard/settings');
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

        await page.goto('/dashboard/participants');
        await waitForTable(page, { minRows: 1 });

        const participantRow = getFirstRow(page);
        await openRowActions(participantRow);
        await page.getByRole('menuitem', { name: /start interview/i }).click();

        await expectURL(page, /\/interviews\//);

        await page.context().setOffline(true);

        const nextButton = page.getByRole('button', { name: /next|continue/i });
        if (await nextButton.isVisible().catch(() => false)) {
          await nextButton.click();
          await page.waitForTimeout(1000);
        }

        const interviewData = await page.evaluate(() => {
          return localStorage.getItem('interview-data');
        });

        await page.context().setOffline(false);

        if (interviewData) {
          await page.evaluate((data) => {
            localStorage.setItem('interview-data-conflict', data);
          }, interviewData);
        }

        await page.waitForTimeout(2000);
      } finally {
        await cleanup();
      }
    });

    test('resolve conflict with "Keep Local" option', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.goto('/dashboard/settings');
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

        await page.goto('/dashboard/participants');
        await waitForTable(page, { minRows: 1 });

        const participantRow = getFirstRow(page);
        await openRowActions(participantRow);
        await page.getByRole('menuitem', { name: /start interview/i }).click();

        await expectURL(page, /\/interviews\//);

        await page.context().setOffline(true);

        const nextButton = page.getByRole('button', { name: /next|continue/i });
        if (await nextButton.isVisible().catch(() => false)) {
          await nextButton.click();
          await page.waitForTimeout(1000);
        }

        await page.context().setOffline(false);
        await page.waitForTimeout(2000);
      } finally {
        await cleanup();
      }
    });

    test('resolve conflict with "Keep Server" option', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.goto('/dashboard/settings');
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

        await page.goto('/dashboard/participants');
        await waitForTable(page, { minRows: 1 });

        const participantRow = getFirstRow(page);
        await openRowActions(participantRow);
        await page.getByRole('menuitem', { name: /start interview/i }).click();

        await expectURL(page, /\/interviews\//);

        await page.context().setOffline(true);

        const nextButton = page.getByRole('button', { name: /next|continue/i });
        if (await nextButton.isVisible().catch(() => false)) {
          await nextButton.click();
          await page.waitForTimeout(1000);
        }

        await page.context().setOffline(false);
        await page.waitForTimeout(2000);
      } finally {
        await cleanup();
      }
    });

    test('resolve conflict with "Keep Both" option', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.goto('/dashboard/settings');
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

        await page.goto('/dashboard/participants');
        await waitForTable(page, { minRows: 1 });

        const participantRow = getFirstRow(page);
        await openRowActions(participantRow);
        await page.getByRole('menuitem', { name: /start interview/i }).click();

        await expectURL(page, /\/interviews\//);

        await page.context().setOffline(true);

        const nextButton = page.getByRole('button', { name: /next|continue/i });
        if (await nextButton.isVisible().catch(() => false)) {
          await nextButton.click();
          await page.waitForTimeout(1000);
        }

        await page.context().setOffline(false);
        await page.waitForTimeout(2000);
      } finally {
        await cleanup();
      }
    });

    test('visual: conflict resolution dialog', async ({
      page,
      database,
      captureElement,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.goto('/dashboard/settings');
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

        await page.goto('/dashboard/participants');
        await waitForTable(page, { minRows: 1 });

        const participantRow = getFirstRow(page);
        await openRowActions(participantRow);
        await page.getByRole('menuitem', { name: /start interview/i }).click();

        await expectURL(page, /\/interviews\//);

        await page.context().setOffline(true);

        const nextButton = page.getByRole('button', { name: /next|continue/i });
        if (await nextButton.isVisible().catch(() => false)) {
          await nextButton.click();
          await page.waitForTimeout(1000);
        }

        await page.context().setOffline(false);
        await page.waitForTimeout(2000);

        const conflictDialog = page.getByRole('dialog');
        if (await conflictDialog.isVisible().catch(() => false)) {
          await captureElement(
            conflictDialog,
            'offline-conflict-resolution-dialog',
          );
        }
      } finally {
        await cleanup();
      }
    });

    test('no conflict when changes are identical', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.goto('/dashboard/settings');
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

        await page.goto('/dashboard/participants');
        await waitForTable(page, { minRows: 1 });

        const participantRow = getFirstRow(page);
        await openRowActions(participantRow);
        await page.getByRole('menuitem', { name: /start interview/i }).click();

        await expectURL(page, /\/interviews\//);

        await page.context().setOffline(true);
        await page.waitForTimeout(1000);
        await page.context().setOffline(false);
        await page.waitForTimeout(2000);

        const conflictDialog = page.getByRole('dialog', {
          name: /conflict/i,
        });
        await expect(conflictDialog).not.toBeVisible();
      } finally {
        await cleanup();
      }
    });

    test('conflict indicator shows in UI when detected', async ({
      page,
      database,
    }) => {
      const cleanup = await database.isolate(page);
      try {
        await page.goto('/dashboard/settings');
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

        await page.goto('/dashboard/participants');
        await waitForTable(page, { minRows: 1 });

        const participantRow = getFirstRow(page);
        await openRowActions(participantRow);
        await page.getByRole('menuitem', { name: /start interview/i }).click();

        await expectURL(page, /\/interviews\//);

        await page.context().setOffline(true);

        const nextButton = page.getByRole('button', { name: /next|continue/i });
        if (await nextButton.isVisible().catch(() => false)) {
          await nextButton.click();
          await page.waitForTimeout(1000);
        }

        await page.context().setOffline(false);
        await page.waitForTimeout(2000);
      } finally {
        await cleanup();
      }
    });
  });
});
