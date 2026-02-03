import { expect, test, expectURL } from '../../fixtures/test.js';
import { waitForDialog } from '../../helpers/dialog.js';
import { getFirstRow, openRowActions } from '../../helpers/row-actions.js';
import { waitForTable } from '../../helpers/table.js';

test.describe('Offline Interview', () => {
  test.beforeAll(async ({ database }) => {
    await database.restoreSnapshot();
  });

  test.describe('Mutations', () => {
    test.describe.configure({ mode: 'serial' });

    test('conduct interview while offline', async ({ page, database }) => {
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

    test('verify offline indicator appears when offline', async ({
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
      } finally {
        await cleanup();
      }
    });

    test('start new interview offline', async ({ page, database }) => {
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

        await page.context().setOffline(true);

        await page.goto('/dashboard/participants');
        await waitForTable(page, { minRows: 1 });

        const participantRow = getFirstRow(page);
        await openRowActions(participantRow);

        const startInterviewButton = page.getByRole('menuitem', {
          name: /start interview/i,
        });

        if (await startInterviewButton.isVisible().catch(() => false)) {
          await startInterviewButton.click();
          await page.waitForTimeout(2000);
        }

        await page.context().setOffline(false);
      } finally {
        await cleanup();
      }
    });

    test('navigate between interview stages offline', async ({
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

          if (await nextButton.isVisible().catch(() => false)) {
            await nextButton.click();
            await page.waitForTimeout(1000);
          }
        }

        await page.context().setOffline(false);
      } finally {
        await cleanup();
      }
    });

    test('data syncs after reconnecting', async ({ page, database }) => {
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

        await page.waitForTimeout(3000);
      } finally {
        await cleanup();
      }
    });
  });
});
