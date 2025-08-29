import { expect, test, type Page } from '@playwright/test';

async function loginAsAdmin(page: Page) {
  await page.goto('/signin');
  await page.fill('[name="username"], [type="text"]', 'admin');
  await page.fill('[name="password"], [type="password"]', 'AdminPass123!');
  await page.click('[type="submit"], button:has-text("Login")');
  await page.waitForURL(/\/(dashboard|protocols|home)/);
}

test.describe('Protocol Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display list of protocols', async ({ page }) => {
    await page.goto('/protocols');

    // Should show protocols page
    await expect(page.locator('h1, h2')).toContainText(/Protocols/i);

    // Should display protocol cards or list items
    const protocols = page.locator(
      '[data-testid="protocol-item"], .protocol-card, [role="article"]',
    );
    await expect(protocols).toHaveCount(11); // 10 + 1 with assets
  });

  test('should search and filter protocols', async ({ page }) => {
    await page.goto('/protocols');

    // Search for specific protocol
    const searchInput = page.locator(
      '[type="search"], [placeholder*="Search"]',
    );
    await searchInput.fill('Protocol 5');

    // Should filter results
    await page.waitForTimeout(500); // Debounce
    const protocols = page.locator(
      '[data-testid="protocol-item"], .protocol-card, [role="article"]',
    );
    await expect(protocols).toHaveCount(1);

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);
    await expect(protocols).toHaveCount(11);
  });

  test('should import a new protocol', async ({ page }) => {
    await page.goto('/protocols');

    // Click import button
    await page.click(
      'button:has-text("Import"), button:has-text("Add Protocol")',
    );

    // Should show import modal or navigate to import page
    await expect(page.locator('h1, h2, h3')).toContainText(
      /Import|Add|Upload/i,
    );

    // Upload protocol file
    const fileInput = page.locator('input[type="file"]');

    // Create a mock protocol file
    const protocolContent = JSON.stringify({
      schemaVersion: 8,
      name: 'Test Import Protocol',
      description: 'Imported via e2e test',
      stages: [
        {
          id: 'stage1',
          label: 'Test Stage',
          type: 'Information',
        },
      ],
      codebook: {
        node: {},
        edge: {},
        ego: {},
      },
    });

    // Set file input
    await fileInput.setInputFiles({
      name: 'test-protocol.netcanvas',
      mimeType: 'application/json',
      buffer: Buffer.from(protocolContent),
    });

    // Confirm import
    const importButton = page.locator(
      'button:has-text("Import"), button:has-text("Upload")',
    );
    await importButton.click();

    // Should show success and redirect
    await expect(page).toHaveURL('/protocols');

    // Verify new protocol appears
    await expect(page.locator('text="Test Import Protocol"')).toBeVisible();
  });

  test('should delete a protocol', async ({ page }) => {
    await page.goto('/protocols');

    // Find a protocol to delete
    const protocolItem = page
      .locator('[data-testid="protocol-item"], .protocol-card')
      .first();

    // Open actions menu
    const menuButton = protocolItem.locator(
      '[data-testid="protocol-menu"], [aria-label*="menu"], button:has-text("⋮")',
    );
    await menuButton.click();

    // Click delete
    await page.click(
      '[role="menuitem"]:has-text("Delete"), button:has-text("Delete")',
    );

    // Confirm deletion
    const confirmButton = page.locator(
      'button:has-text("Confirm"), button:has-text("Delete"):visible',
    );
    await confirmButton.click();

    // Should show success message
    await expect(page.locator('.toast, [role="alert"]')).toContainText(
      /deleted|removed/i,
    );

    // Protocol count should decrease
    const protocols = page.locator(
      '[data-testid="protocol-item"], .protocol-card',
    );
    await expect(protocols).toHaveCount(10);
  });

  test('should view protocol details', async ({ page }) => {
    await page.goto('/protocols');

    // Click on a protocol
    const protocolLink = page.locator('a:has-text("Protocol with Assets")');
    await protocolLink.click();

    // Should navigate to protocol details
    await expect(page).toHaveURL(/\/protocols\/[a-z0-9-]+/);

    // Should display protocol information
    await expect(page.locator('h1, h2')).toContainText('Protocol with Assets');

    // Should show assets if available
    const assets = page.locator('[data-testid="asset-item"], .asset-card');
    await expect(assets).toHaveCount(2);
  });

  test('should handle protocol with ongoing interviews', async ({ page }) => {
    await page.goto('/protocols');

    // Try to delete a protocol (assuming some have interviews)
    const protocolWithInterviews = page
      .locator('text="Test Study Protocol"')
      .first();

    if (await protocolWithInterviews.isVisible()) {
      const parent = protocolWithInterviews.locator('..');
      const menuButton = parent.locator(
        '[data-testid="protocol-menu"], button:has-text("⋮")',
      );
      await menuButton.click();

      await page.click('[role="menuitem"]:has-text("Delete")');

      // Should show warning about existing interviews
      await expect(page.locator('[role="dialog"], .modal')).toContainText(
        /interviews|cannot delete|in use/i,
      );

      // Cancel deletion
      await page.click('button:has-text("Cancel")');
    }
  });
});
