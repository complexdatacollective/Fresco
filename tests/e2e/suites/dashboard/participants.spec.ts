import { expect, test } from '@playwright/test';

test.describe('Participant Management', () => {
  // No need for beforeEach login - using stored auth state from config

  test('should display participants list', async ({ page }) => {
    await page.goto('/participants');

    // Should show participants page
    await expect(page.locator('h1, h2')).toContainText(/Participants/i);

    // Should display participant list
    const participants = page.locator(
      '[data-testid="participant-item"], tr[data-participant]',
    );
    await expect(participants).toHaveCount(20);
  });

  test('should search participants', async ({ page }) => {
    await page.goto('/participants');

    // Search for specific participant
    const searchInput = page.locator(
      '[type="search"], [placeholder*="Search"]',
    );
    await searchInput.fill('P005');

    // Wait for search to update
    await page.waitForTimeout(500);

    // Should filter results
    const participants = page.locator(
      '[data-testid="participant-item"], tr[data-participant]',
    );
    await expect(participants).toHaveCount(1);
    await expect(participants.first()).toContainText('Participant 5');
  });

  test('should add a new participant', async ({ page }) => {
    await page.goto('/participants');

    // Click add participant button
    await page.click(
      'button:has-text("Add Participant"), button:has-text("New Participant")',
    );

    // Fill participant form
    const identifierInput = page.locator('[name="identifier"]');
    const labelInput = page.locator('[name="label"], [name="name"]');

    const newId = `P${Date.now()}`;
    await identifierInput.fill(newId);
    await labelInput.fill('Test Participant');

    // Submit form
    await page.click(
      'button:has-text("Add"), button:has-text("Create"), button:has-text("Save")',
    );

    // Should show success message
    await expect(page.locator('.toast, [role="alert"]')).toContainText(
      /added|created/i,
    );

    // New participant should appear in list
    await expect(page.locator(`text="${newId}"`)).toBeVisible();
  });

  test('should view participant details', async ({ page }) => {
    await page.goto('/participants');

    // Click on a participant with interviews
    const participantRow = page
      .locator(
        'tr:has-text("P001"), [data-testid="participant-item"]:has-text("P001")',
      )
      .first();
    await participantRow.click();

    // Should navigate to participant details
    await expect(page).toHaveURL(/\/participants\/[a-z0-9-]+/);

    // Should display participant information
    await expect(page.locator('h1, h2')).toContainText(/P001|Alice/);

    // Should show interview history
    const interviews = page.locator(
      '[data-testid="interview-item"], .interview-history-item',
    );
    expect(await interviews.count()).toBeGreaterThan(0);
  });

  test('should edit participant information', async ({ page }) => {
    await page.goto('/participants');

    // Find a participant to edit
    const participantRow = page.locator('tr:has-text("P010")').first();

    // Open actions menu
    const menuButton = participantRow.locator(
      'button[aria-label*="menu"], button:has-text("⋮")',
    );
    await menuButton.click();

    // Click edit
    await page.click('[role="menuitem"]:has-text("Edit")');

    // Update participant label
    const labelInput = page.locator('[name="label"], [name="name"]');
    await labelInput.clear();
    await labelInput.fill('Updated Participant Name');

    // Save changes
    await page.click('button:has-text("Save"), button:has-text("Update")');

    // Should show success message
    await expect(page.locator('.toast, [role="alert"]')).toContainText(
      /updated|saved/i,
    );

    // Updated name should appear
    await expect(page.locator('text="Updated Participant Name"')).toBeVisible();
  });

  test('should filter participants by interview status', async ({ page }) => {
    await page.goto('/participants');

    // Filter by participants with interviews
    const filterSelect = page.locator(
      'select[name="interviewStatus"], [data-testid="interview-filter"]',
    );
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption('with-interviews');

      // Should show only participants with interviews (first 10)
      const participants = page.locator(
        '[data-testid="participant-item"], tr[data-participant]',
      );
      await expect(participants).toHaveCount(10);
    }
  });

  test('should bulk select and export participants', async ({ page }) => {
    await page.goto('/participants');

    // Select all checkbox
    const selectAllCheckbox = page.locator(
      'input[type="checkbox"][data-testid="select-all"], thead input[type="checkbox"]',
    );
    await selectAllCheckbox.check();

    // Bulk actions should appear
    const bulkActions = page.locator(
      '[data-testid="bulk-actions"], .bulk-actions',
    );
    await expect(bulkActions).toBeVisible();

    // Click export
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click(
        'button:has-text("Export Selected"), button:has-text("Export")',
      ),
    ]);

    // Verify download
    expect(download.suggestedFilename()).toMatch(/participants.*\.(csv|json)/);
  });

  test('should delete a participant without interviews', async ({ page }) => {
    await page.goto('/participants');

    // Find a participant without interviews (P011-P020)
    const participantRow = page.locator('tr:has-text("P015")').first();

    // Open actions menu
    const menuButton = participantRow.locator(
      'button[aria-label*="menu"], button:has-text("⋮")',
    );
    await menuButton.click();

    // Click delete
    await page.click('[role="menuitem"]:has-text("Delete")');

    // Confirm deletion
    await page.click(
      'button:has-text("Confirm"), button:has-text("Delete"):visible',
    );

    // Should show success message
    await expect(page.locator('.toast, [role="alert"]')).toContainText(
      /deleted/i,
    );

    // Participant should be removed from list
    await expect(page.locator('text="P015"')).not.toBeVisible();
  });

  test('should prevent deletion of participant with interviews', async ({
    page,
  }) => {
    await page.goto('/participants');

    // Find a participant with interviews (P001-P010)
    const participantRow = page.locator('tr:has-text("P001")').first();

    // Open actions menu
    const menuButton = participantRow.locator(
      'button[aria-label*="menu"], button:has-text("⋮")',
    );
    await menuButton.click();

    // Click delete
    await page.click('[role="menuitem"]:has-text("Delete")');

    // Should show warning
    await expect(page.locator('[role="dialog"], .modal')).toContainText(
      /cannot delete|has interviews|associated data/i,
    );

    // Cancel deletion
    await page.click('button:has-text("Cancel")');

    // Participant should still be in list
    await expect(page.locator('text="P001"')).toBeVisible();
  });

  test('should handle anonymous participant creation', async ({ page }) => {
    await page.goto('/participants');

    // Click quick add or anonymous participant button
    const quickAddButton = page.locator(
      'button:has-text("Quick Add"), button:has-text("Anonymous")',
    );
    if (await quickAddButton.isVisible()) {
      await quickAddButton.click();

      // Should create participant with auto-generated ID
      await expect(page.locator('.toast, [role="alert"]')).toContainText(
        /created|added/i,
      );

      // Refresh to see new participant
      await page.reload();

      // Should have 21 participants now
      const participants = page.locator(
        '[data-testid="participant-item"], tr[data-participant]',
      );
      await expect(participants).toHaveCount(21);
    }
  });

  test('should show participant statistics', async ({ page }) => {
    await page.goto('/participants');

    // Should display statistics
    const stats = page.locator(
      '[data-testid="participant-stats"], .stats-card',
    );

    if (await stats.first().isVisible()) {
      // Total participants
      await expect(stats.first()).toContainText('20');

      // With interviews
      const withInterviews = stats.locator('text=/with interview/i');
      if (await withInterviews.isVisible()) {
        await expect(withInterviews).toContainText('10');
      }
    }
  });
});
