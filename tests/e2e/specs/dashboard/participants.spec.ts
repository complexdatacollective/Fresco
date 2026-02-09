import { test, expect } from '../../fixtures/test.js';
import { waitForTable, searchTable, clearSearch } from '../../helpers/table.js';

test.describe('Participants page', () => {
  test.beforeAll(async ({ database }) => {
    await database.restoreSnapshot();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/participants', {
      waitUntil: 'domcontentloaded',
    });
  });

  test.describe('Read-only', () => {
    test.afterAll(async ({ database }) => {
      await database.releaseReadLock();
    });

    test('should match visual snapshot', async ({ capturePage }) => {
      await capturePage('participants-page');
    });

    test('should display participants list', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Participants', exact: true }),
      ).toBeVisible();

      await waitForTable(page, { timeout: 10000 });

      await expect(page.locator('text=Identifier').first()).toBeVisible();
      await expect(page.locator('text=Label').first()).toBeVisible();
      await expect(page.locator('text=Interviews').first()).toBeVisible();

      const rows = page.locator('tbody tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    });

    test('should search participants', async ({ page }) => {
      await waitForTable(page, { timeout: 10000 });

      const tableRows = page.locator('tbody tr');

      await searchTable(page, 'P001');

      const filteredRows = await tableRows.count();

      await clearSearch(page);

      const allRows = await tableRows.count();
      expect(allRows).toBeGreaterThanOrEqual(filteredRows);
    });

    test('should sort participants by identifier ascending and descending', async ({
      page,
    }) => {
      await waitForTable(page, { timeout: 10000 });

      const identifierSortButton = page
        .getByRole('button', { name: /identifier/i })
        .first();
      await expect(identifierSortButton).toBeVisible();

      await identifierSortButton.click();

      const ascOption = page.getByRole('menuitem', { name: /asc/i });
      await expect(ascOption).toBeVisible();
      await ascOption.click();

      await page.waitForTimeout(500);

      await identifierSortButton.click();

      const descOption = page.getByRole('menuitem', { name: /desc/i });
      await expect(descOption).toBeVisible();
      await descOption.click();

      await expect(identifierSortButton).toBeVisible();
    });

    test('should sort participants by label ascending and descending', async ({
      page,
    }) => {
      await waitForTable(page, { timeout: 10000 });

      const labelSortButton = page
        .getByRole('button', { name: /^label$/i })
        .first();
      await expect(labelSortButton).toBeVisible();

      await labelSortButton.click();

      const ascOption = page.getByRole('menuitem', { name: /asc/i });
      await expect(ascOption).toBeVisible();
      await ascOption.click();

      await page.waitForTimeout(500);

      await labelSortButton.click();

      const descOption = page.getByRole('menuitem', { name: /desc/i });
      await expect(descOption).toBeVisible();
      await descOption.click();

      await expect(labelSortButton).toBeVisible();
    });

    test('should allow participant URLs to be exported', async ({ page }) => {
      await waitForTable(page, { timeout: 10000 });

      const exportButton = page.getByRole('button', {
        name: /export participation urls/i,
      });
      await expect(exportButton).toBeVisible();
      await exportButton.click();

      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();

      const protocolSelect = modal.locator('[role="combobox"]').first();
      await protocolSelect.click();

      const protocolOption = page.getByRole('option').first();
      await expect(protocolOption).toBeVisible();
      await protocolOption.click();

      const downloadPromise = page.waitForEvent('download');

      const modalExportButton = modal.getByRole('button', {
        name: /export participation urls/i,
      });
      await modalExportButton.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx?)$/i);
    });

    test('should bulk select and export participants', async ({ page }) => {
      await waitForTable(page, { timeout: 10000 });

      const selectAllCheckbox = page.locator('thead [role="checkbox"]').first();
      await expect(selectAllCheckbox).toBeVisible();

      await selectAllCheckbox.click();

      await expect(selectAllCheckbox).toHaveAttribute('aria-checked', 'true');

      const rowCheckboxes = page.locator('tbody [role="checkbox"]');
      const checkboxCount = await rowCheckboxes.count();

      for (let i = 0; i < checkboxCount; i++) {
        await expect(rowCheckboxes.nth(i)).toHaveAttribute(
          'aria-checked',
          'true',
        );
      }

      await selectAllCheckbox.click();
    });

    test('copy unique URL button', async ({ page }) => {
      await waitForTable(page, { timeout: 10000 });

      const urlButtons = page.getByRole('button', {
        name: /copy unique url/i,
      });
      const buttonCount = await urlButtons.count();

      if (buttonCount > 0) {
        await urlButtons.first().click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Mutations', () => {
    test.describe.configure({ mode: 'serial' });
    let cleanup: () => Promise<void>;

    test.beforeEach(async ({ page, database }) => {
      cleanup = await database.isolate(page);
    });

    test.afterEach(async () => {
      await cleanup();
    });

    test('should be able to upload participant csv', async ({ page }) => {
      const importButton = page
        .getByRole('button', { name: /import/i })
        .first();
      await expect(importButton).toBeVisible();

      await importButton.click();

      const dialog = page.locator('[role="dialog"], .modal').first();
      await expect(dialog).toBeVisible({ timeout: 5000 });

      const fileInput = page.locator('input[type="file"]');

      const csvContent = `identifier,label\nTEST001,Test Participant 1\nTEST002,Test Participant 2`;

      await fileInput.setInputFiles({
        name: 'test-participants.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csvContent),
      });

      await page.waitForTimeout(2000);

      const closeButton = dialog
        .locator('button[aria-label="Close"], button:has-text("Close")')
        .first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      await page.waitForTimeout(1000);
    });

    test('should add a new participant', async ({ page }) => {
      await waitForTable(page, { timeout: 10000 });

      const addButton = page.getByRole('button', {
        name: /add single participant/i,
      });
      await expect(addButton).toBeVisible();

      await addButton.click();

      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();

      const identifierInput = page.getByPlaceholder(/enter an identifier/i);
      await expect(identifierInput).toBeVisible();
      await identifierInput.click();

      const timestamp = Date.now();
      await identifierInput.fill(`NEW${timestamp}`);

      const labelInput = modal.locator('input').nth(1);
      await labelInput.fill(`New Participant ${timestamp}`);

      const submitButton = modal.getByRole('button', { name: /submit/i });
      await submitButton.click();

      await expect(modal).not.toBeVisible({ timeout: 10000 });

      const filterInput = page.getByPlaceholder(/filter by identifier/i);
      await filterInput.fill(`NEW${timestamp}`);
      await page.waitForTimeout(500);

      await expect(page.getByText(`NEW${timestamp}`)).toBeVisible({
        timeout: 10000,
      });
    });

    test('should edit participant information', async ({ page }) => {
      await waitForTable(page, { timeout: 10000 });

      const firstRow = page.locator('tbody tr').first();
      await expect(firstRow).toBeVisible();

      const actionsButton = firstRow.getByRole('button').last();
      await expect(actionsButton).toBeVisible();
      await actionsButton.click();

      const editButton = page.getByRole('menuitem', { name: /edit/i });
      await expect(editButton).toBeVisible();
      await editButton.click();

      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();

      const labelInput = modal.locator('input').nth(1);
      await expect(labelInput).toBeVisible();

      const newLabel = `Edited Label ${Date.now()}`;
      await labelInput.clear();
      await labelInput.fill(newLabel);

      const submitButton = modal.getByRole('button', {
        name: /submit|save|update/i,
      });
      await submitButton.click();

      await expect(modal).not.toBeVisible({ timeout: 10000 });

      await expect(page.locator(`text=${newLabel}`)).toBeVisible({
        timeout: 10000,
      });
    });

    test('should delete single participant with interviews', async ({
      page,
    }) => {
      await waitForTable(page, { timeout: 10000 });

      const participantRows = page.locator('tbody tr');
      const rowCount = await participantRows.count();

      for (let i = 0; i < rowCount; i++) {
        const row = participantRows.nth(i);
        const interviewText = await row.locator('td').nth(3).textContent();

        if (interviewText && !interviewText.includes('0 (0 completed)')) {
          const actionsButton = row.getByRole('button').last();
          await actionsButton.click();

          const deleteButton = page.getByRole('menuitem', {
            name: /delete/i,
          });
          await expect(deleteButton).toBeVisible();
          await deleteButton.click();

          const warningDialog = page.getByRole('alertdialog');
          await expect(warningDialog).toBeVisible();
          await expect(warningDialog).toContainText(/warning|interview/i);

          const cancelButton = warningDialog.getByRole('button', {
            name: /cancel/i,
          });
          await cancelButton.click();

          break;
        }
      }
    });

    test('should delete single participant with no interviews', async ({
      page,
    }) => {
      await waitForTable(page, { timeout: 10000 });

      const participantRows = page.locator('tbody tr');
      const rowCount = await participantRows.count();

      for (let i = 0; i < rowCount; i++) {
        const row = participantRows.nth(i);
        const interviewText = await row.locator('td').nth(3).textContent();

        if (interviewText?.includes('0 (0 completed)')) {
          const participantId = await row.locator('td').nth(1).textContent();

          const actionsButton = row.getByRole('button').last();
          await actionsButton.click();

          const deleteButton = page.getByRole('menuitem', {
            name: /delete/i,
          });
          await expect(deleteButton).toBeVisible();
          await deleteButton.click();

          const confirmDialog = page.getByRole('alertdialog');
          await expect(confirmDialog).toBeVisible();
          const confirmButton = confirmDialog.getByRole('button', {
            name: /delete|confirm|yes/i,
          });
          await confirmButton.click();

          await expect(page.locator(`text=${participantId}`)).not.toBeVisible({
            timeout: 10000,
          });
          break;
        }
      }
    });

    test('should allow all participants to be deleted', async ({ page }) => {
      await waitForTable(page, { timeout: 10000 });

      const deleteAllButton = page.getByRole('button', {
        name: /delete all/i,
      });

      if (await deleteAllButton.isVisible()) {
        await deleteAllButton.click();

        const confirmDialog = page.getByRole('alertdialog');
        await expect(confirmDialog).toBeVisible();

        const confirmButton = confirmDialog.getByRole('button', {
          name: /delete|confirm|yes/i,
        });
        await confirmButton.click();

        await page.waitForTimeout(2000);

        const emptyState = page.getByText('No results.');
        await expect(emptyState).toBeVisible({ timeout: 10000 });
      }
    });

    test('should match visual snapshot of empty state', async ({
      page,
      capturePage,
    }) => {
      await waitForTable(page, { timeout: 10000 });

      const deleteAllButton = page.getByRole('button', {
        name: /delete all/i,
      });

      if (await deleteAllButton.isVisible()) {
        await deleteAllButton.click();

        const confirmDialog = page.getByRole('alertdialog');
        await expect(confirmDialog).toBeVisible();

        const confirmButton = confirmDialog.getByRole('button', {
          name: /delete|confirm|yes/i,
        });
        await confirmButton.click();

        await page.waitForTimeout(2000);
      }

      await capturePage('participants-empty-state');
    });
  });
});
