import { type Locator, type Page } from '@playwright/test';

/**
 * Quick Add fixture for NameGeneratorQuickAdd stages.
 */
class QuickAddFixture {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Add a node using quick add.
   *
   * Opens the quick add form if not already open,
   * types the name, and presses Enter to submit.
   * Waits for the node to appear on the page.
   *
   * @param name - The name/label for the new node
   */
  async addNode(name: string): Promise<void> {
    const toggle = this.page.getByTestId('quick-add-toggle');
    const input = this.page.getByTestId('quick-add-input');

    // Check if toggle is pressed (form is open)
    const isPressed = await toggle.getAttribute('aria-pressed');

    if (isPressed !== 'true') {
      await toggle.click();
      // Wait for input to appear
      await input.waitFor({ state: 'visible' });
    }

    // Clear any existing text and type the new name
    await input.fill(name);

    // Submit by pressing Enter
    await input.press('Enter');

    // Wait for the node to appear on the page
    const node = this.page.getByRole('option', { name });
    await node.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Check if quick add is disabled (e.g., max nodes reached).
   */
  async isDisabled(): Promise<boolean> {
    const toggle = this.page.getByTestId('quick-add-toggle');
    return toggle.isDisabled();
  }
}

/**
 * Stage fixture for e2e tests.
 *
 * Handles stage-specific elements and interactions.
 */
export class StageFixture {
  readonly page: Page;
  readonly quickAdd: QuickAddFixture;

  constructor(page: Page) {
    this.page = page;
    this.quickAdd = new QuickAddFixture(page);
  }

  /**
   * Get a node by its label.
   * Nodes are rendered with role="option" in the node list.
   *
   * @param label - The node label text
   */
  getNode(label: string): Locator {
    return this.page.getByRole('option', { name: label });
  }

  /**
   * Delete a node using keyboard navigation.
   *
   * Uses Ctrl+D to initiate drag mode, arrow keys to navigate
   * to the delete bin, and Enter to drop.
   *
   * @param label - The node label to delete
   */
  async deleteNode(label: string): Promise<void> {
    const node = this.getNode(label);

    // Focus the node
    await node.focus();

    // Start keyboard drag with Ctrl+D
    await node.press('Control+d');

    // Navigate to the delete bin (cycle through drop targets)
    // The bin should be one of the targets - keep pressing arrow until we find it
    // We'll press ArrowDown up to 10 times to find the delete bin
    for (let i = 0; i < 10; i++) {
      await this.page.keyboard.press('ArrowDown');

      // Small delay to let the announcement happen
      await this.page.waitForTimeout(100);
    }

    // Drop the node
    await this.page.keyboard.press('Enter');

    // Wait for the node to be removed
    await node.waitFor({ state: 'hidden', timeout: 5000 });
  }
}
