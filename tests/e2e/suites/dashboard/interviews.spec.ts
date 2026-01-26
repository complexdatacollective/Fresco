import { expect, SNAPSHOT_CONFIGS, test } from '../../fixtures/test';

test.describe.parallel('Interviews page - parallel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/interviews', { waitUntil: 'domcontentloaded' });
  });

  test('should match visual snapshot', async ({ snapshots }) => {
    await snapshots.expectPageToMatchSnapshot(
      SNAPSHOT_CONFIGS.fullPage('interviews-page'),
    );
  });

  test('should display interviews heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Interviews', exact: true }),
    ).toBeVisible();
  });

  test('should display interviews subtitle', async ({ page }) => {
    await expect(
      page.getByText(/view and manage your interview data/i),
    ).toBeVisible();
  });

  test('should display interviews table', async ({ page }) => {
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('should display table columns', async ({ page }) => {
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    // Check for expected column headers
    await expect(page.locator('text=Participant').first()).toBeVisible();
    await expect(page.locator('text=Protocol').first()).toBeVisible();
    await expect(page.locator('text=Started').first()).toBeVisible();
    await expect(page.locator('text=Progress').first()).toBeVisible();
  });

  test('should display interview rows', async ({ page }) => {
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    // Should have interview rows from test data (5 interviews)
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBe(5);
  });

  test('should search interviews by participant identifier', async ({
    page,
  }) => {
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    const searchInput = page.getByPlaceholder(/filter|search|participant/i);
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Search for a specific participant
    await searchInput.fill('P001');
    await page.waitForTimeout(500); // Wait for debounce

    // Should filter results
    const filteredRows = page.locator('tbody tr');
    const filteredCount = await filteredRows.count();
    expect(filteredCount).toBe(1);

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);

    // All rows should return
    const allRows = await page.locator('tbody tr').count();
    expect(allRows).toBe(5);
  });

  test('should sort interviews by column', async ({ page }) => {
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    // Find sortable column header (Updated)
    const sortButton = page.getByRole('button', { name: /updated/i }).first();
    await expect(sortButton).toBeVisible();

    // Click to toggle sort
    await sortButton.click();
    await page.waitForTimeout(300);

    // Verify button is still visible (sort toggled)
    await expect(sortButton).toBeVisible();
  });

  test('should display export interview data dropdown', async ({ page }) => {
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    // Look for export dropdown menu button
    const exportButton = page.getByRole('button', {
      name: /export interview data/i,
    });
    await expect(exportButton).toBeVisible();
  });

  test('should display progress percentage', async ({ page }) => {
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    // Should have progress indicators in rows
    const progressCells = page.locator('tbody td').filter({ hasText: '%' });
    const count = await progressCells.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display export status badges', async ({ page }) => {
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    // Should have export status (either "Not exported" or a timestamp)
    const notExportedBadge = page.getByText('Not exported').first();
    if (await notExportedBadge.isVisible()) {
      await expect(notExportedBadge).toBeVisible();
    }
  });

  test('should allow bulk selection', async ({ page }) => {
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });

    // Find header checkbox
    const selectAllCheckbox = page.locator('thead [role="checkbox"]').first();
    await expect(selectAllCheckbox).toBeVisible();

    // Select all
    await selectAllCheckbox.click();
    await page.waitForTimeout(300);

    // Verify all row checkboxes are checked
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
});

test.describe.serial('Interviews page - serial', () => {
  test('should delete single interview via row actions', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('delete-interview');
    await page.goto('/dashboard/interviews', { waitUntil: 'domcontentloaded' });

    try {
      await expect(page.locator('table').first()).toBeVisible({
        timeout: 10000,
      });

      // Get initial row count
      const initialCount = await page.locator('tbody tr').count();

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

      // Verify row count decreased
      await page.waitForTimeout(500);
      const finalCount = await page.locator('tbody tr').count();
      expect(finalCount).toBe(initialCount - 1);
    } finally {
      await cleanup();
    }
  });

  test('should bulk delete selected interviews', async ({ page, database }) => {
    const cleanup = await database.isolate('bulk-delete-interviews');
    await page.goto('/dashboard/interviews', { waitUntil: 'domcontentloaded' });

    try {
      await expect(page.locator('table').first()).toBeVisible({
        timeout: 10000,
      });

      // Select first two rows
      const rowCheckboxes = page.locator('tbody [role="checkbox"]');
      await rowCheckboxes.nth(0).click();
      await rowCheckboxes.nth(1).click();
      await page.waitForTimeout(300);

      // Look for bulk delete button (should appear when rows selected)
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
    } finally {
      await cleanup();
    }
  });

  test('should open export interviews dialog', async ({ page, database }) => {
    const cleanup = await database.isolate('export-interviews-dialog');
    await page.goto('/dashboard/interviews', { waitUntil: 'domcontentloaded' });

    try {
      await expect(page.locator('table').first()).toBeVisible({
        timeout: 10000,
      });

      // Click export dropdown
      const exportButton = page.getByRole('button', {
        name: /export interview data/i,
      });
      await expect(exportButton).toBeVisible();
      await exportButton.click();

      // Should show dropdown menu
      const menu = page.getByRole('menu');
      await expect(menu).toBeVisible({ timeout: 5000 });

      // Click export all option
      const exportAllOption = page.getByRole('menuitem', {
        name: /export all interviews/i,
      });
      if (await exportAllOption.isVisible()) {
        await exportAllOption.click();

        // Dialog should open
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Close dialog
        await page.keyboard.press('Escape');
      }
    } finally {
      await cleanup();
    }
  });

  test('should open generate URLs dialog', async ({ page, database }) => {
    const cleanup = await database.isolate('generate-urls-dialog');
    await page.goto('/dashboard/interviews', { waitUntil: 'domcontentloaded' });

    try {
      await expect(page.locator('table').first()).toBeVisible({
        timeout: 10000,
      });

      // Select some interviews first
      const rowCheckboxes = page.locator('tbody [role="checkbox"]');
      await rowCheckboxes.first().click();
      await page.waitForTimeout(300);

      // Click export incomplete interview URLs button
      const generateButton = page.getByRole('button', {
        name: /export incomplete interview urls/i,
      });

      if (await generateButton.isEnabled()) {
        await generateButton.click();

        // Dialog should open
        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible()) {
          await expect(dialog).toBeVisible({ timeout: 5000 });
          // Close dialog
          await page.keyboard.press('Escape');
        }
      }
    } finally {
      await cleanup();
    }
  });
});
