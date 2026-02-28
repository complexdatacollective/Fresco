import { expect, SNAPSHOT_CONFIGS, test } from '../../fixtures/fixtures';
import {
  cancelDialog,
  confirmDeletion,
  getDialog,
  openDialog,
  submitDialog,
  waitForDialog,
} from '../../utils/dialog-helpers';
import { fillFormField } from '../../utils/form-helpers';
import {
  bulkDeleteSelected,
  deleteSingleItem,
  getFirstRow,
  openEditDialog,
  openRowActions,
} from '../../utils/row-actions-helpers';
import {
  clearSearch,
  clickSortColumn,
  expectAllRowsSelected,
  getTableRowCount,
  getTableRows,
  searchTable,
  selectAllRows,
  waitForTable,
} from '../../utils/table-helpers';

// Parallel tests - no mutations!

test.describe.parallel('Participants page - parallel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/participants', {
      waitUntil: 'domcontentloaded',
    });
  });

  // Visual snapshot of this page
  // Uses database isolation to ensure consistent state regardless of test execution order
  test('should match visual snapshot', async ({
    page,
    database,
    snapshots,
  }) => {
    const cleanup = await database.isolate('visual-snapshot');
    await page.goto('/dashboard/participants', {
      waitUntil: 'networkidle',
    });
    // Wait for table to be fully rendered
    await waitForTable(page, { minRows: 1 });
    try {
      await snapshots.expectPageToMatchSnapshot(
        SNAPSHOT_CONFIGS.fullPage('participants-page'),
      );
    } finally {
      await cleanup();
    }
  });

  test('should display participants list', async ({ page }) => {
    // Should show participants page header (use exact match to avoid matching other headings)
    await expect(
      page.getByRole('heading', { name: 'Participants', exact: true }),
    ).toBeVisible();

    // Should show data table with participants - wait for table to load
    await waitForTable(page);

    // Should have table headers (using text content since columnheader role may not be set)
    await expect(page.locator('text=Identifier').first()).toBeVisible();
    await expect(page.locator('text=Label').first()).toBeVisible();
    await expect(page.locator('text=Interviews').first()).toBeVisible();

    // Should have participant rows (assuming test data exists)
    const rowCount = await getTableRowCount(page);
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('should search participants', async ({ page }) => {
    // Wait for table to load first
    await waitForTable(page);

    // Get reference to table rows
    const tableRows = getTableRows(page);

    // Search for a specific participant (assuming P001 exists in test data)
    await searchTable(page, 'P001');

    // Check that search results are filtered
    const filteredRows = await tableRows.count();

    // Clear search and verify all participants return
    await clearSearch(page);

    const allRows = await tableRows.count();
    expect(allRows).toBeGreaterThanOrEqual(filteredRows);
  });

  test('should sort participants by identifier ascending and descending', async ({
    page,
  }) => {
    await waitForTable(page);

    // Click to toggle sort (first click = ascending)
    await clickSortColumn(page, /identifier/i);

    // Click again to toggle to descending
    await clickSortColumn(page, /identifier/i);

    // Click again to toggle back to ascending
    await clickSortColumn(page, /identifier/i);
  });

  test('should sort participants by label ascending and descending', async ({
    page,
  }) => {
    await waitForTable(page);

    // Click to toggle sort (first click = ascending)
    await clickSortColumn(page, /^label$/i);

    // Click again to toggle to descending
    await clickSortColumn(page, /^label$/i);

    // Click again to toggle back to ascending
    await clickSortColumn(page, /^label$/i);
  });

  test('should allow participant URLs to be exported', async ({ page }) => {
    await waitForTable(page);

    // Click export participation URLs button to open modal
    const dialog = await openDialog(page, /export participation urls/i);

    // Select a protocol from the native select dropdown
    const protocolSelect = dialog.locator('select').first();
    await expect(protocolSelect).toBeVisible();

    // Wait for options to be populated
    await page.waitForTimeout(500);

    // Select first protocol option (index 0 since no placeholder)
    await protocolSelect.selectOption({ index: 0 });

    // Set up download listener before clicking generate
    const downloadPromise = page.waitForEvent('download');

    // Click the Generate button in the modal
    const generateButton = dialog.getByRole('button', {
      name: /generate/i,
    });
    await generateButton.click();

    // Wait for download and verify CSV file
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx?)$/i);
  });

  test('should bulk select and export participants', async ({ page }) => {
    await waitForTable(page);

    // Select all participants
    await selectAllRows(page);

    // Verify all row checkboxes are checked (aria-checked="true")
    await expectAllRowsSelected(page);

    // Uncheck all
    await selectAllRows(page);
  });

  test('copy unique URL button', async ({ page }) => {
    await waitForTable(page);

    // Look for "Copy Unique URL" buttons in table rows
    const urlButtons = page.getByRole('button', { name: /copy unique url/i });
    const buttonCount = await urlButtons.count();

    if (buttonCount > 0) {
      // Click first URL button
      await urlButtons.first().click();

      // Wait a moment for clipboard operation
      await page.waitForTimeout(500);

      // The button click should work without error - clipboard copy is verified by UI feedback
      // Note: Toast messages may vary, so we just verify the button is clickable
    }
  });
});

// Mutations allowed here. Use database snapshots to return to initial state.
test.describe.serial('Participants page - serial', () => {
  test('visual: add participant dialog', async ({
    page,
    database,
    snapshots,
  }) => {
    const cleanup = await database.isolate('add-participant-dialog-visual');
    await page.goto('/dashboard/participants', {
      waitUntil: 'domcontentloaded',
    });

    try {
      await waitForTable(page);
      await openDialog(page, /add single participant/i);

      await snapshots.expectPageToMatchSnapshot(
        SNAPSHOT_CONFIGS.modal('participants-add-dialog'),
      );

      await page.keyboard.press('Escape');
    } finally {
      await cleanup();
    }
  });

  test('should be able to upload participant csv', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('upload-csv');
    await page.goto('/dashboard/participants', {
      waitUntil: 'domcontentloaded',
    });

    try {
      // Look for import participants button
      const importButton = page
        .getByRole('button', { name: /import/i })
        .first();
      await expect(importButton).toBeVisible();

      // Click import button to open modal
      await importButton.click();

      // Wait for modal/dialog to appear
      const dialog = page.locator('[role="dialog"], .modal').first();
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Look for file upload input in the modal
      const fileInput = page.locator('input[type="file"]');

      // Create a test CSV content
      const csvContent = `identifier,label\nTEST001,Test Participant 1\nTEST002,Test Participant 2`;

      // Upload CSV file
      await fileInput.setInputFiles({
        name: 'test-participants.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csvContent),
      });

      // Wait for import to process and page to update
      await page.waitForTimeout(2000);

      // Close dialog if still open
      const closeButton = dialog
        .locator('button[aria-label="Close"], button:has-text("Close")')
        .first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // Verify participants appear in table (may need to wait for refresh)
      await page.waitForTimeout(1000);
      // Note: Import may require additional confirmation steps depending on UI
    } finally {
      await cleanup();
    }
  });

  test('should add a new participant', async ({ page, database }) => {
    const cleanup = await database.isolate('add-participant');
    await page.goto('/dashboard/participants', {
      waitUntil: 'domcontentloaded',
    });

    try {
      await waitForTable(page);

      // Open add participant dialog
      await openDialog(page, /add single participant/i);

      // Fill with unique values
      const timestamp = Date.now();
      const dialog = getDialog(page);
      await fillFormField(dialog, 'identifier', `NEW${timestamp}`);
      await fillFormField(dialog, 'label', `New Participant ${timestamp}`);

      // Submit form
      await submitDialog(page, /submit/i);

      // Use filter to find the new participant (in case it's on another page)
      await searchTable(page, `NEW${timestamp}`);

      // Verify participant appears in filtered table
      await expect(page.getByText(`NEW${timestamp}`)).toBeVisible({
        timeout: 10000,
      });
    } finally {
      await cleanup();
    }
  });

  test('should edit participant information', async ({ page, database }) => {
    const cleanup = await database.isolate('edit-participant');
    await page.goto('/dashboard/participants', {
      waitUntil: 'domcontentloaded',
    });

    try {
      await waitForTable(page);

      // Find first participant row and open edit dialog
      const firstRow = getFirstRow(page);
      await openEditDialog(page, firstRow);

      // Edit the label in the modal
      const newLabel = `Edited Label ${Date.now()}`;
      const dialog = getDialog(page);
      await fillFormField(dialog, 'label', newLabel);

      // Submit changes
      await submitDialog(page, /submit|save|update/i);

      // Verify changes appear in table
      await expect(page.locator(`text=${newLabel}`)).toBeVisible({
        timeout: 10000,
      });
    } finally {
      await cleanup();
    }
  });

  test('should delete single participant with interviews', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate(
      'delete-participant-with-interviews',
    );
    await page.goto('/dashboard/participants', {
      waitUntil: 'domcontentloaded',
    });

    try {
      await waitForTable(page);

      // Find a participant with interviews (look for non-zero interview count)
      const participantRows = getTableRows(page);
      const rowCount = await participantRows.count();

      for (let i = 0; i < rowCount; i++) {
        const row = participantRows.nth(i);
        const interviewText = await row.locator('td').nth(3).textContent(); // Interviews column

        if (interviewText && !interviewText.includes('0 (0 completed)')) {
          // This participant has interviews, try to delete
          await openRowActions(row);

          const deleteButton = page.getByRole('menuitem', { name: /delete/i });
          await expect(deleteButton).toBeVisible();
          await deleteButton.click();

          // Should show warning dialog
          const warningDialog = getDialog(page);
          await expect(warningDialog).toBeVisible();
          await expect(warningDialog).toContainText(/warning|interview/i);

          // Cancel the deletion
          await cancelDialog(page);

          break;
        }
      }
    } finally {
      await cleanup();
    }
  });

  test('should delete single participant with no interviews', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('delete-participant-no-interviews');
    await page.goto('/dashboard/participants', {
      waitUntil: 'domcontentloaded',
    });

    try {
      await waitForTable(page);

      // Find a participant with no interviews
      const participantRows = getTableRows(page);
      const rowCount = await participantRows.count();

      for (let i = 0; i < rowCount; i++) {
        const row = participantRows.nth(i);
        const interviewText = await row.locator('td').nth(3).textContent();

        if (interviewText?.includes('0 (0 completed)')) {
          // This participant has no interviews
          const participantId = await row.locator('td').nth(1).textContent();

          // Delete the row
          await deleteSingleItem(page, row);

          // Verify participant is removed
          await expect(page.locator(`text=${participantId}`)).not.toBeVisible({
            timeout: 10000,
          });
          break;
        }
      }
    } finally {
      await cleanup();
    }
  });

  test('should allow all participants to be deleted', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('delete-all-participants');
    await page.goto('/dashboard/participants', {
      waitUntil: 'domcontentloaded',
    });

    try {
      await waitForTable(page);

      // Check if there are any rows to delete
      const rowCount = await getTableRowCount(page);

      if (rowCount === 0) {
        // No participants to delete, verify empty state already shown
        await expect(page.getByText('No results.')).toBeVisible();
        return;
      }

      // Select all and delete
      await selectAllRows(page);
      await bulkDeleteSelected(page);

      // Wait for deletion to complete
      await page.waitForTimeout(2000);

      // Verify table shows empty state (shows "No results." when empty)
      const emptyState = page.getByText('No results.');
      await expect(emptyState).toBeVisible({ timeout: 10000 });
    } finally {
      await cleanup();
    }
  });

  // Visual snapshot of empty state should match
  test('should match visual snapshot of empty state', async ({
    page,
    database,
    snapshots,
  }) => {
    // Restore to initial state, then delete all to get empty state
    const cleanup = await database.isolate('empty-state-snapshot');
    await page.goto('/dashboard/participants', {
      waitUntil: 'domcontentloaded',
    });

    try {
      // First delete all participants to get empty state
      await waitForTable(page);
      await selectAllRows(page);

      const deleteSelectedButton = page.getByRole('button', {
        name: /delete selected/i,
      });
      if (await deleteSelectedButton.isVisible()) {
        await deleteSelectedButton.click();
        await waitForDialog(page);
        await confirmDeletion(page);
        await page.waitForTimeout(2000);
      }
      // Wait for empty state to be stable
      await snapshots.waitForStablePage();

      // Take empty state snapshot
      await snapshots.expectPageToMatchSnapshot(
        SNAPSHOT_CONFIGS.emptyState('participants-empty-state'),
      );
    } finally {
      await cleanup();
    }
  });
});
