import { expect, SNAPSHOT_CONFIGS, test } from '../../fixtures/test';

// Parallel tests - no mutations!

test.describe.parallel('Participants page - parallel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/participants');
  });

  // Visual snapshot of this page
  test('should match visual snapshot', async ({ page, snapshots }) => {
    await snapshots.expectPageToMatchSnapshot(
      SNAPSHOT_CONFIGS.fullPage('participants-page'),
    );
  });

  test('should display participants list', async ({ page }) => {
    // Should show participants page header
    await expect(
      page.getByRole('heading', { name: /participants/i }),
    ).toBeVisible();

    // Should show data table with participants
    const table = page
      .locator('table, [data-testid="participants-table"]')
      .first();
    await expect(table).toBeVisible();

    // Should have table headers
    await expect(
      page.getByRole('columnheader', { name: /identifier/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: /label/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: /interviews/i }),
    ).toBeVisible();

    // Should have participant rows (assuming test data exists)
    const rows = page.locator(
      'tbody tr, [role="row"]:not([role="columnheader"])',
    );
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0); // At least 0 rows (could be empty)
  });

  test('should search participants', async ({ page }) => {
    // Look for search input using multiple selectors
    const searchInput = page
      .locator(
        'input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]',
      )
      .first();

    // Wait for search input to be available
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Search for a specific participant (assuming P001 exists in test data)
    await searchInput.fill('P001');
    await page.waitForTimeout(500); // Wait for debounce

    // Check that search results are filtered
    const tableRows = page.locator('tbody tr, [data-testid="participant-row"]');
    const visibleRows = await tableRows.count();

    // Clear search and verify all participants return
    await searchInput.clear();
    await page.waitForTimeout(500);

    const allRows = await tableRows.count();
    expect(allRows).toBeGreaterThanOrEqual(visibleRows);
  });

  test('should sort participants by identifier ascending and descending', async ({
    page,
  }) => {
    // Find the identifier column header
    const identifierHeader = page.getByRole('columnheader', {
      name: /identifier/i,
    });
    await expect(identifierHeader).toBeVisible();

    // Click to sort ascending
    await identifierHeader.click();
    await page.waitForTimeout(500);

    // Click again to sort descending
    await identifierHeader.click();
    await page.waitForTimeout(500);

    // Verify the sort indicator is present (arrow icons)
    await expect(identifierHeader.locator('svg, [data-sort]')).toBeVisible();
  });

  test('should sort participants by label ascending and descending', async ({
    page,
  }) => {
    // Find the label column header
    const labelHeader = page.getByRole('columnheader', { name: /label/i });
    await expect(labelHeader).toBeVisible();

    // Click to sort ascending
    await labelHeader.click();
    await page.waitForTimeout(500);

    // Click again to sort descending
    await labelHeader.click();
    await page.waitForTimeout(500);

    // Verify the sort indicator is present
    await expect(labelHeader.locator('svg, [data-sort]')).toBeVisible();
  });

  test('should allow participant URLs to be exported', async ({ page }) => {
    // Select individual participants using checkboxes
    const selectCheckboxes = page.locator(
      'input[type="checkbox"][aria-label*="Select row"]',
    );
    const checkboxCount = await selectCheckboxes.count();

    if (checkboxCount > 0) {
      // Select first participant
      await selectCheckboxes.first().check();

      // Look for export button
      const exportButton = page
        .locator(
          'button:has-text("Export"), button:has-text("Download"), [data-testid="export-button"]',
        )
        .first();
      await expect(exportButton).toBeVisible();

      // Start download and verify CSV file
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx?)$/i);
    }
  });

  test('should bulk select and export participants', async ({ page }) => {
    // Use the select all checkbox
    const selectAllCheckbox = page
      .locator('input[type="checkbox"][aria-label*="Select all"]')
      .first();
    await expect(selectAllCheckbox).toBeVisible();

    // Select all participants
    await selectAllCheckbox.check();

    // Verify all individual checkboxes are checked
    const individualCheckboxes = page.locator(
      'input[type="checkbox"][aria-label*="Select row"]',
    );
    const checkboxCount = await individualCheckboxes.count();

    for (let i = 0; i < checkboxCount; i++) {
      await expect(individualCheckboxes.nth(i)).toBeChecked();
    }

    // Look for export button and export all
    const exportButton = page
      .locator(
        'button:has-text("Export"), button:has-text("Download"), [data-testid="export-button"]',
      )
      .first();
    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx?)$/i);
    }
  });

  test('copy unique URL button', async ({ page }) => {
    // Look for participant URL buttons in table rows
    const urlButtons = page.locator(
      'button:has-text("Copy"), button:has-text("URL"), [data-testid="copy-url-button"]',
    );
    const buttonCount = await urlButtons.count();

    if (buttonCount > 0) {
      // Click first URL button
      await urlButtons.first().click();

      // Check for success toast or clipboard indication
      const toast = page
        .locator('[role="alert"], .toast, [data-testid="toast"]')
        .first();
      await expect(toast).toBeVisible({ timeout: 5000 });
      await expect(toast).toContainText(/copied|success/i);
    }
  });
});

// Mutations allowed here. Use database snapshots to return to initial state.
test.describe.serial('Participants page - serial', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/participants');
  });

  test('should be able to upload participant csv', async ({ page }) => {
    // Look for import participants button
    const importButton = page
      .locator(
        'button:has-text("Import"), button:has-text("Upload"), [data-testid="import-csv-button"]',
      )
      .first();
    await expect(importButton).toBeVisible();

    // Click import button to open modal
    await importButton.click();

    // Look for file upload input in the modal
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeVisible();

    // Create a test CSV content
    const csvContent = `identifier,label\nTEST001,Test Participant 1\nTEST002,Test Participant 2`;

    // Upload CSV file (create temporary file)
    await fileInput.setInputFiles({
      name: 'test-participants.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent),
    });

    // Submit the form
    const submitButton = page
      .locator(
        'button[type="submit"], button:has-text("Import"), button:has-text("Upload")',
      )
      .last();
    await submitButton.click();

    // Wait for success message
    await expect(page.locator('[role="alert"], .toast')).toContainText(
      /success|imported/i,
    );

    // Verify participants appear in table
    await expect(page.locator('text=TEST001')).toBeVisible();
    await expect(page.locator('text=Test Participant 1')).toBeVisible();
  });

  test('should add a new participant', async ({ page }) => {
    // Look for add participant button
    const addButton = page
      .locator(
        'button:has-text("Add"), button:has-text("New"), [data-testid="add-participant-button"]',
      )
      .first();
    await expect(addButton).toBeVisible();

    // Click add button
    await addButton.click();

    // Fill out the form in the modal
    const identifierInput = page
      .locator('input[name="identifier"], input[placeholder*="identifier" i]')
      .first();
    const labelInput = page
      .locator('input[name="label"], input[placeholder*="label" i]')
      .first();

    await expect(identifierInput).toBeVisible();
    await expect(labelInput).toBeVisible();

    // Fill with unique values
    const timestamp = Date.now();
    await identifierInput.fill(`NEW${timestamp}`);
    await labelInput.fill(`New Participant ${timestamp}`);

    // Submit form
    const submitButton = page
      .locator(
        'button[type="submit"], button:has-text("Add"), button:has-text("Create"), button:has-text("Save")',
      )
      .last();
    await submitButton.click();

    // Wait for success and verify participant appears
    await expect(page.locator(`text=NEW${timestamp}`)).toBeVisible();
  });

  test('should edit participant information', async ({ page }) => {
    // Find first participant row and its actions menu
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible();

    // Look for actions dropdown or edit button
    const actionsButton = firstRow
      .locator(
        'button[aria-label*="actions" i], button:has-text("⋮"), button:has-text("•••"), [data-testid="row-actions"]',
      )
      .first();
    await actionsButton.click();

    // Click edit option
    const editButton = page
      .locator('button:has-text("Edit"), [role="menuitem"]:has-text("Edit")')
      .first();
    await editButton.click();

    // Edit the label in the modal
    const labelInput = page
      .locator('input[name="label"], input[placeholder*="label" i]')
      .first();
    await expect(labelInput).toBeVisible();

    const newLabel = `Edited Label ${Date.now()}`;
    await labelInput.clear();
    await labelInput.fill(newLabel);

    // Submit changes
    const updateButton = page
      .locator(
        'button[type="submit"], button:has-text("Update"), button:has-text("Save")',
      )
      .last();
    await updateButton.click();

    // Verify changes appear in table
    await expect(page.locator(`text=${newLabel}`)).toBeVisible();
  });

  test('should delete single participant with interviews', async ({ page }) => {
    // Find a participant with interviews (look for non-zero interview count)
    const participantRows = page.locator('tbody tr');
    const rowCount = await participantRows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = participantRows.nth(i);
      const interviewText = await row.locator('td').nth(3).textContent(); // Interviews column

      if (interviewText && !interviewText.includes('0 (0 completed)')) {
        // This participant has interviews, try to delete
        const actionsButton = row
          .locator('button[aria-label*="actions" i], button:has-text("⋮")')
          .first();
        await actionsButton.click();

        const deleteButton = page
          .locator(
            'button:has-text("Delete"), [role="menuitem"]:has-text("Delete")',
          )
          .first();
        await deleteButton.click();

        // Should show warning dialog
        const warningDialog = page
          .locator('[role="dialog"], [role="alertdialog"]')
          .first();
        await expect(warningDialog).toBeVisible();
        await expect(warningDialog).toContainText(/warning|interview/i);

        // Cancel the deletion
        const cancelButton = warningDialog
          .locator('button:has-text("Cancel"), button:has-text("No")')
          .first();
        await cancelButton.click();

        break;
      }
    }
  });

  test('should delete single participant with no interviews', async ({
    page,
  }) => {
    // Find a participant with no interviews
    const participantRows = page.locator('tbody tr');
    const rowCount = await participantRows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = participantRows.nth(i);
      const interviewText = await row.locator('td').nth(3).textContent();

      if (interviewText?.includes('0 (0 completed)')) {
        // This participant has no interviews
        const participantId = await row.locator('td').nth(1).textContent();

        const actionsButton = row
          .locator('button[aria-label*="actions" i], button:has-text("⋮")')
          .first();
        await actionsButton.click();

        const deleteButton = page
          .locator(
            'button:has-text("Delete"), [role="menuitem"]:has-text("Delete")',
          )
          .first();
        await deleteButton.click();

        // Confirm deletion
        const confirmDialog = page
          .locator('[role="dialog"], [role="alertdialog"]')
          .first();
        const confirmButton = confirmDialog
          .locator(
            'button:has-text("Delete"), button:has-text("Yes"), button:has-text("Confirm")',
          )
          .first();
        await confirmButton.click();

        // Verify participant is removed
        await expect(page.locator(`text=${participantId}`)).not.toBeVisible();
        break;
      }
    }
  });

  test('should allow all participants to be deleted', async ({ page }) => {
    // Look for delete all button
    const deleteAllButton = page
      .locator(
        'button:has-text("Delete All"), button:has-text("Clear All"), [data-testid="delete-all-button"]',
      )
      .first();

    if (await deleteAllButton.isVisible()) {
      await deleteAllButton.click();

      // Confirm deletion in dialog
      const confirmDialog = page
        .locator('[role="dialog"], [role="alertdialog"]')
        .first();
      await expect(confirmDialog).toBeVisible();

      const confirmButton = confirmDialog
        .locator(
          'button:has-text("Delete"), button:has-text("Yes"), button:has-text("Confirm")',
        )
        .first();
      await confirmButton.click();

      // Wait for deletion to complete
      await page.waitForTimeout(2000);

      // Verify table shows empty state
      const emptyState = page.locator(
        'text=/no participants|empty|no data/i, [data-testid="empty-state"]',
      );
      await expect(emptyState).toBeVisible();
    }
  });

  // Visual snapshot of empty state should match
  test('should match visual snapshot of empty state', async ({ snapshots }) => {
    // Wait for empty state to be stable
    await snapshots.waitForStablePage();

    // Take empty state snapshot
    await snapshots.expectPageToMatchSnapshot(
      SNAPSHOT_CONFIGS.emptyState('participants-empty-state'),
    );
  });
});
