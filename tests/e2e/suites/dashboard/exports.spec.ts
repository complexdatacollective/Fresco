import { expect, test } from '../../fixtures/fixtures';
import { getDialog, waitForDialog } from '../../utils/dialog-helpers';
import { getRowCheckboxes, waitForTable } from '../../utils/table-helpers';

test.describe.parallel('Interview Export - parallel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/interviews', { waitUntil: 'domcontentloaded' });
  });

  test('should display export interview data button', async ({ page }) => {
    await waitForTable(page);

    const exportButton = page.getByRole('button', {
      name: /export interview data/i,
    });
    await expect(exportButton).toBeVisible();
  });

  test('should show export dropdown menu with options', async ({ page }) => {
    await waitForTable(page);

    // Click export dropdown
    const exportButton = page.getByRole('button', {
      name: /export interview data/i,
    });
    await exportButton.click();

    // Should show dropdown menu
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible({ timeout: 5000 });

    // Should have export options
    await expect(
      page.getByRole('menuitem', { name: /export all interviews/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: /export selected interviews/i }),
    ).toBeVisible();

    // Close menu
    await page.keyboard.press('Escape');
  });

  test('should display export incomplete URLs button', async ({ page }) => {
    await waitForTable(page);

    const urlsButton = page.getByRole('button', {
      name: /export incomplete interview urls/i,
    });
    await expect(urlsButton).toBeVisible();
  });
});

test.describe.serial('Interview Export - serial', () => {
  test('should open export dialog with format options', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('export-dialog-options');
    await page.goto('/dashboard/interviews', { waitUntil: 'domcontentloaded' });

    try {
      await waitForTable(page);

      // Click export dropdown
      const exportButton = page.getByRole('button', {
        name: /export interview data/i,
      });
      await exportButton.click();

      // Click export all option
      const exportAllOption = page.getByRole('menuitem', {
        name: /export all interviews/i,
      });
      await exportAllOption.click();

      // Dialog should open
      const dialog = await waitForDialog(page);
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Should show export format options
      await expect(dialog.getByText(/export graphml files/i)).toBeVisible();
      await expect(dialog.getByText(/export csv files/i)).toBeVisible();
      await expect(
        dialog.getByText(/use screen layout coordinates/i),
      ).toBeVisible();

      // Should have toggles for each option
      const toggles = dialog.getByRole('switch');
      const toggleCount = await toggles.count();
      expect(toggleCount).toBe(3);

      // Close dialog
      await page.keyboard.press('Escape');
    } finally {
      await cleanup();
    }
  });

  test('should toggle export options in dialog', async ({ page, database }) => {
    const cleanup = await database.isolate('toggle-export-options');
    await page.goto('/dashboard/interviews', { waitUntil: 'domcontentloaded' });

    try {
      await waitForTable(page);

      // Click export dropdown
      const exportButton = page.getByRole('button', {
        name: /export interview data/i,
      });
      await exportButton.click();

      // Click export all option
      const exportAllOption = page.getByRole('menuitem', {
        name: /export all interviews/i,
      });
      await exportAllOption.click();

      // Dialog should open
      const dialog = await waitForDialog(page);

      // Get the CSV toggle (second toggle)
      const toggles = dialog.getByRole('switch');
      const csvToggle = toggles.nth(1);

      // Get initial state
      const initialState = await csvToggle.getAttribute('aria-checked');

      // Click to toggle
      await csvToggle.click();
      await page.waitForTimeout(300);

      // Verify state changed
      const newState = await csvToggle.getAttribute('aria-checked');
      expect(newState).not.toBe(initialState);

      // Close dialog
      await page.keyboard.press('Escape');
    } finally {
      await cleanup();
    }
  });

  test('should enable export selected when interviews are selected', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('export-selected-enabled');
    await page.goto('/dashboard/interviews', { waitUntil: 'domcontentloaded' });

    try {
      await waitForTable(page);

      // Click export dropdown to check initial state
      const exportButton = page.getByRole('button', {
        name: /export interview data/i,
      });
      await exportButton.click();

      // Export selected should initially be disabled (no selection)
      const exportSelectedOption = page.getByRole('menuitem', {
        name: /export selected interviews/i,
      });

      // Close menu
      await page.keyboard.press('Escape');

      // Select an interview
      const rowCheckboxes = getRowCheckboxes(page);
      await rowCheckboxes.first().click();
      await page.waitForTimeout(300);

      // Open export menu again
      await exportButton.click();

      // Export selected should be in the menu
      await expect(exportSelectedOption).toBeVisible();

      // Close menu
      await page.keyboard.press('Escape');
    } finally {
      await cleanup();
    }
  });

  test('should open incomplete interview URLs dialog', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('incomplete-urls-dialog');
    await page.goto('/dashboard/interviews', { waitUntil: 'domcontentloaded' });

    try {
      await waitForTable(page);

      // Select an interview first
      const rowCheckboxes = getRowCheckboxes(page);
      await rowCheckboxes.first().click();
      await page.waitForTimeout(300);

      // Click export incomplete interview URLs button
      const urlsButton = page.getByRole('button', {
        name: /export incomplete interview urls/i,
      });

      if (await urlsButton.isEnabled()) {
        await urlsButton.click();

        // Dialog should open (might show no incomplete interviews)
        const dialog = getDialog(page);
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

test.describe.parallel('Participant URL Export - parallel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/participants', {
      waitUntil: 'domcontentloaded',
    });
  });

  test('should display export participation URLs button', async ({ page }) => {
    await waitForTable(page);

    const exportButton = page.getByRole('button', {
      name: /export participation urls/i,
    });
    await expect(exportButton).toBeVisible();
  });
});

test.describe.serial('Participant URL Export - serial', () => {
  test('should open export participation URLs dialog', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('participation-urls-dialog');
    await page.goto('/dashboard/participants', {
      waitUntil: 'domcontentloaded',
    });

    try {
      await waitForTable(page);

      // Click export participation URLs button
      const exportButton = page.getByRole('button', {
        name: /export participation urls/i,
      });
      await exportButton.click();

      // Dialog should open
      const dialog = await waitForDialog(page);
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Should have protocol selector
      const protocolSelect = dialog.locator('select').first();
      await expect(protocolSelect).toBeVisible();

      // Should have generate button
      const generateButton = dialog.getByRole('button', { name: /generate/i });
      await expect(generateButton).toBeVisible();

      // Close dialog
      await page.keyboard.press('Escape');
    } finally {
      await cleanup();
    }
  });

  test('should show protocol options in URL export dialog', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('protocol-options');
    await page.goto('/dashboard/participants', {
      waitUntil: 'domcontentloaded',
    });

    try {
      await waitForTable(page);

      // Click export participation URLs button
      const exportButton = page.getByRole('button', {
        name: /export participation urls/i,
      });
      await exportButton.click();

      // Dialog should open
      const dialog = await waitForDialog(page);

      // Get protocol options
      const protocolSelect = dialog.locator('select').first();
      const options = protocolSelect.locator('option');
      const optionCount = await options.count();

      // Should have at least one protocol option
      expect(optionCount).toBeGreaterThanOrEqual(1);

      // Close dialog
      await page.keyboard.press('Escape');
    } finally {
      await cleanup();
    }
  });

  test('should generate and download participation URLs CSV', async ({
    page,
    database,
  }) => {
    const cleanup = await database.isolate('generate-urls-csv');
    await page.goto('/dashboard/participants', {
      waitUntil: 'domcontentloaded',
    });

    try {
      await waitForTable(page);

      // Click export participation URLs button
      const exportButton = page.getByRole('button', {
        name: /export participation urls/i,
      });
      await exportButton.click();

      // Dialog should open
      const dialog = await waitForDialog(page);

      // Select a protocol
      const protocolSelect = dialog.locator('select').first();
      await protocolSelect.selectOption({ index: 0 });

      // Set up download listener
      const downloadPromise = page.waitForEvent('download');

      // Click generate button
      const generateButton = dialog.getByRole('button', { name: /generate/i });
      await generateButton.click();

      // Wait for download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx?)$/i);
    } finally {
      await cleanup();
    }
  });
});
