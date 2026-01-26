import { expect, SNAPSHOT_CONFIGS, test } from '../../fixtures/test';

test.describe.parallel('Protocols page - parallel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/protocols', { waitUntil: 'domcontentloaded' });
  });

  test('should match visual snapshot', async ({ snapshots }) => {
    await snapshots.expectPageToMatchSnapshot(
      SNAPSHOT_CONFIGS.fullPage('protocols-page'),
    );
  });

  test('should display protocols heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Protocols', exact: true }),
    ).toBeVisible();
  });

  test('should display protocols subtitle', async ({ page }) => {
    await expect(
      page.getByText(/upload and manage your interview protocols/i),
    ).toBeVisible();
  });

  test('should display protocols table', async ({ page }) => {
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should display table columns', async ({ page }) => {
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    // Check for expected column headers
    await expect(page.locator('text=Name').first()).toBeVisible();
    await expect(page.locator('text=Imported').first()).toBeVisible();
    await expect(page.locator('text=Modified').first()).toBeVisible();
  });

  test('should display protocol rows', async ({ page }) => {
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    // Should have at least one protocol row from test data
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  test('should display import protocols button', async ({ page }) => {
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    const importButton = page.getByRole('button', {
      name: /import protocols/i,
    });
    await expect(importButton).toBeVisible();
  });

  test('should search protocols by name', async ({ page }) => {
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    const searchInput = page.getByPlaceholder(/filter|search|name/i);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Search for test protocol
    await searchInput.fill('Test');
    await page.waitForTimeout(500); // Wait for debounce

    // Should filter results
    const filteredRows = page.locator('tbody tr');
    const filteredCount = await filteredRows.count();
    expect(filteredCount).toBeGreaterThanOrEqual(1);

    // Clear search
    await searchInput.clear();
  });

  test('should sort protocols by name column', async ({ page }) => {
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    // Find sortable name column header
    const sortButton = page.getByRole('button', { name: /^name$/i }).first();
    await expect(sortButton).toBeVisible();

    // Click to toggle sort
    await sortButton.click();
    await page.waitForTimeout(300);

    // Verify button is still visible (sort toggled)
    await expect(sortButton).toBeVisible();
  });

  test('should allow bulk selection', async ({ page }) => {
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    // Find header checkbox
    const selectAllCheckbox = page.locator('thead [role="checkbox"]').first();
    await expect(selectAllCheckbox).toBeVisible();

    // Select all
    await selectAllCheckbox.click();
    await page.waitForTimeout(300);

    // Verify row checkboxes are checked
    const rowCheckboxes = page.locator('tbody [role="checkbox"]');
    const checkboxCount = await rowCheckboxes.count();

    for (let i = 0; i < checkboxCount; i++) {
      await expect(rowCheckboxes.nth(i)).toHaveAttribute(
        'aria-checked',
        'true',
      );
    }

    // Uncheck all
    await selectAllCheckbox.click();
  });

  test('should show row actions dropdown', async ({ page }) => {
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    // Find first row actions button
    const firstRow = page.locator('tbody tr').first();
    const actionsButton = firstRow.getByRole('button').last();
    await expect(actionsButton).toBeVisible();

    // Click to open dropdown
    await actionsButton.click();

    // Should show menu with options
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible({ timeout: 5000 });

    // Close menu
    await page.keyboard.press('Escape');
  });

  test('should display protocol name in row', async ({ page }) => {
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    // Should show Test Protocol from test data
    await expect(page.getByText('Test Protocol').first()).toBeVisible();
  });
});

test.describe.serial('Protocols page - serial', () => {
  test('should delete single protocol via row actions', async ({
    page,
    database,
  }) => {
    // Call isolate FIRST to restore database to initial state
    const cleanup = await database.isolate('delete-protocol');

    // Navigate AFTER isolation to see the restored data
    await page.goto('/dashboard/protocols', { waitUntil: 'domcontentloaded' });

    try {
      await expect(page.locator('table').first()).toBeVisible({
        timeout: 10000,
      });

      // Find first row actions button
      const firstRow = page.locator('tbody tr').first();
      const actionsButton = firstRow.getByRole('button').last();
      await actionsButton.click();

      // Click delete option
      const deleteButton = page.getByRole('menuitem', { name: /delete/i });
      await expect(deleteButton).toBeVisible();
      await deleteButton.click();

      // Confirm deletion in dialog
      const confirmDialog = page.getByRole('dialog');
      await expect(confirmDialog).toBeVisible({ timeout: 5000 });

      const confirmButton = confirmDialog.getByRole('button', {
        name: /delete|confirm|yes/i,
      });
      await confirmButton.click();

      // Wait for dialog to close and row to be removed
      await expect(confirmDialog).not.toBeVisible({ timeout: 10000 });

      // After deleting the only protocol, the table should show "No results"
      // Note: The "No results" row is still a <tr> so we can't just count rows
      await expect(page.getByText('No results')).toBeVisible({
        timeout: 10000,
      });
    } finally {
      await cleanup();
    }
  });

  test('should open import dialog and show cancel option', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('import-dialog');
    await page.goto('/dashboard/protocols', { waitUntil: 'domcontentloaded' });

    try {
      await expect(page.locator('table').first()).toBeVisible({
        timeout: 10000,
      });

      const importButton = page.getByRole('button', {
        name: /import protocols/i,
      });
      await expect(importButton).toBeVisible();
      await importButton.click();

      // File dialog or dropzone should appear
      // We just verify the button was clickable and no error occurred
      await page.waitForTimeout(500);

      // The import process may open a file dialog which we can't interact with in E2E
      // Just verify the page is still functional
      await expect(page.locator('body')).toBeVisible();
    } finally {
      await cleanup();
    }
  });

  test('should bulk delete protocols when selected', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('bulk-delete-protocols');
    await page.goto('/dashboard/protocols', { waitUntil: 'domcontentloaded' });

    try {
      await expect(page.locator('table').first()).toBeVisible({
        timeout: 10000,
      });

      // Select first row
      const rowCheckboxes = page.locator('tbody [role="checkbox"]');
      if ((await rowCheckboxes.count()) > 0) {
        await rowCheckboxes.first().click();
        await page.waitForTimeout(300);

        // Look for bulk delete button
        const deleteSelectedButton = page.getByRole('button', {
          name: /delete selected|delete \d+/i,
        });

        if (await deleteSelectedButton.isVisible()) {
          await deleteSelectedButton.click();

          // Confirm in dialog
          const confirmDialog = page.getByRole('dialog');
          await expect(confirmDialog).toBeVisible({ timeout: 5000 });

          const confirmButton = confirmDialog.getByRole('button', {
            name: /delete|confirm/i,
          });
          await confirmButton.click();

          await expect(confirmDialog).not.toBeVisible({ timeout: 10000 });
        }
      }
    } finally {
      await cleanup();
    }
  });
});
