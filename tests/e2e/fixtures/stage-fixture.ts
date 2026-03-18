import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Form fixture for EgoForm/AlterForm/NameGenerator stages.
 *
 * Provides methods to interact with form fields using their data-field-name attribute.
 */
class FormFixture {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get a field container by its field name.
   * Fields have data-field-name attribute set by the form system.
   */
  private getField(fieldName: string): Locator {
    return this.page.locator(`[data-field-name="${fieldName}"]`);
  }

  /**
   * Fill a text input field.
   */
  async fillText(fieldName: string, value: string): Promise<void> {
    const field = this.getField(fieldName);
    const input = field.locator('input, textarea').first();
    await input.click();
    await input.fill(value);
    await expect(input).toHaveValue(value);
  }

  /**
   * Select a radio option within a field.
   */
  async selectRadio(fieldName: string, optionLabel: string): Promise<void> {
    const field = this.getField(fieldName);
    const radio = field.getByRole('radio', { name: optionLabel });
    await radio.click();
    await expect(radio).toBeChecked();
  }

  /**
   * Select a specific option within a ToggleButtonGroup.
   * ToggleButtonGroup renders options as checkboxes.
   */
  async selectToggleButton(
    fieldName: string,
    optionLabel: string,
  ): Promise<void> {
    const field = this.getField(fieldName);
    const option = field.getByRole('checkbox', {
      name: optionLabel,
      exact: true,
    });
    await option.click();
    await expect(option).toBeChecked();
  }

  /**
   * Select a specific checkbox option within a checkbox group.
   */
  async selectCheckbox(fieldName: string, optionLabel: string): Promise<void> {
    const field = this.getField(fieldName);
    const checkbox = field.getByRole('checkbox', {
      name: optionLabel,
      exact: true,
    });
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  }

  /**
   * Fill a date input field.
   */
  async fillDate(fieldName: string, value: string): Promise<void> {
    const field = this.getField(fieldName);
    const input = field.locator('input[type="date"]');
    await input.fill(value);
    await expect(input).toHaveValue(value);
  }

  /**
   * Fill a number input field.
   */
  async fillNumber(fieldName: string, value: string): Promise<void> {
    const field = this.getField(fieldName);
    const input = field.getByRole('spinbutton');
    await input.click();
    await input.fill(value);
    await expect(input).toHaveValue(value);
  }

  /**
   * Get a field's error element locator.
   * Use with expect().toBeVisible() to verify validation errors are shown.
   */
  getFieldError(fieldName: string): Locator {
    return this.page.getByTestId(`${fieldName}-field-error`);
  }
}

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
   */
  async addNode(name: string): Promise<void> {
    const toggle = this.page.getByTestId('quick-add-toggle');
    const input = this.page.getByTestId('quick-add-input');

    // Check if toggle is pressed (form is open)
    const isPressed = await toggle.getAttribute('aria-pressed');

    if (isPressed !== 'true') {
      await toggle.click();
      await input.waitFor({ state: 'visible' });
    }

    await input.fill(name);
    await input.press('Enter');

    // Wait for the node to appear
    const node = this.page.getByRole('option', { name });
    await node.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Check if quick add is disabled (e.g., max nodes reached).
   */
  async isDisabled(): Promise<boolean> {
    const toggle = this.page.getByTestId('quick-add-toggle');
    await toggle.waitFor({ state: 'visible' });
    return toggle.isDisabled();
  }
}

/**
 * NameGenerator fixture for form-based node creation stages.
 */
class NameGeneratorFixture {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get the prompt locator.
   * @param text - Optional text pattern to filter the prompt by content.
   */
  getPrompt(text?: string | RegExp): Locator {
    const prompt = this.page.getByTestId('prompt');
    return text ? prompt.filter({ hasText: text }) : prompt;
  }

  /**
   * Open the add node form by clicking the add button.
   */
  async openAddForm(): Promise<void> {
    const addButton = this.page.getByRole('button', { name: 'Add a person' });
    await addButton.click();
    await this.page.getByRole('dialog').waitFor({ state: 'visible' });
  }

  /**
   * Submit the node form by clicking the Finished button.
   */
  async submitForm(): Promise<void> {
    const submitButton = this.page.getByRole('button', { name: 'Finished' });
    await submitButton.click();
    await this.page.getByRole('dialog').waitFor({ state: 'hidden' });
  }
}

/**
 * Sociogram fixture for sociogram/canvas stages.
 *
 * Provides methods to interact with nodes on the canvas,
 * create/toggle edges, and toggle highlighting.
 */
class SociogramFixture {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get the prompt locator.
   * @param text - Optional text pattern to filter the prompt by content.
   */
  getPrompt(text?: string | RegExp): Locator {
    const prompt = this.page.getByTestId('prompt');
    return text ? prompt.filter({ hasText: text }) : prompt;
  }

  /**
   * Get a node on the canvas by its label.
   * Nodes are rendered as buttons with aria-label containing their name.
   */
  getNode(label: string): Locator {
    // Match nodes whose aria-label starts with the node name
    return this.page.getByRole('button', { name: new RegExp(`^${label}`) });
  }

  /**
   * Click a node on the canvas.
   * In edge creation mode, clicking two nodes toggles an edge between them.
   * In highlighting mode, clicking toggles the highlight attribute.
   */
  async clickNode(label: string): Promise<void> {
    const node = this.getNode(label);
    await node.click();
  }

  /**
   * Check if a node is highlighted (via highlight behavior).
   */
  async isNodeHighlighted(label: string): Promise<boolean> {
    const node = this.getNode(label);
    const highlightedAttr = await node.getAttribute('data-node-highlighted');
    return highlightedAttr === 'true';
  }

  /**
   * Connect two nodes by clicking them in sequence.
   * The first click selects the source node (linking mode),
   * the second click creates/toggles the edge.
   */
  async connectNodes(fromLabel: string, toLabel: string): Promise<void> {
    await this.clickNode(fromLabel);
    // Wait for linking state
    await expect(this.getNode(fromLabel)).toHaveAttribute(
      'data-node-linking',
      'true',
    );
    await this.clickNode(toLabel);
    // Wait for linking to clear
    await expect(this.getNode(fromLabel)).not.toHaveAttribute(
      'data-node-linking',
    );
    // Wait for edge render (Redux dispatch → component re-render → RAF)
    await this.page.waitForTimeout(200);
  }

  /**
   * Disconnect two connected nodes by toggling the edge.
   * This is the same as connecting - clicking both nodes toggles the edge.
   */
  async disconnectNodes(fromLabel: string, toLabel: string): Promise<void> {
    await this.connectNodes(fromLabel, toLabel);
  }

  /**
   * Get the number of edges currently displayed on the canvas.
   * Edges are rendered as SVG line elements.
   */
  async getEdgeCount(): Promise<number> {
    const svg = this.page.locator('svg');
    const lines = svg.locator('line[visibility="visible"]');
    return lines.count();
  }

  /**
   * Toggle highlighting on a node by clicking it.
   * Use in highlighting mode (prompt with highlight.allowHighlighting = true).
   */
  async toggleHighlight(label: string): Promise<void> {
    await this.clickNode(label);
  }
}

/**
 * OrdinalBin fixture for ordinal bin stages.
 *
 * Provides methods to interact with bins and drag nodes between them.
 */
class OrdinalBinFixture {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get the prompt locator.
   * @param text - Optional text pattern to filter the prompt by content.
   */
  getPrompt(text?: string | RegExp): Locator {
    const prompt = this.page.getByTestId('prompt');
    return text ? prompt.filter({ hasText: text }) : prompt;
  }

  /**
   * Get the drawer toggle button.
   * The button has aria-label "Collapse drawer" or "Expand drawer".
   */
  get drawerToggle(): Locator {
    return this.page.getByRole('button', { name: /drawer/i });
  }

  /**
   * Get the number of unplaced nodes from the drawer toggle text.
   */
  async getUnplacedCount(): Promise<number> {
    const text = await this.drawerToggle.textContent();
    const match = /(\d+)\s*unplaced/.exec(text ?? '');
    return match ? parseInt(match[1]!, 10) : 0;
  }

  /**
   * Get a bin by its label (e.g., "Very close", "Close", etc.).
   * Returns the bin container that includes both the heading and the node list.
   */
  getBin(label: string): Locator {
    // Find the heading with the label (exact match to avoid "Very close" matching "Not very close")
    return this.page
      .getByRole('heading', { name: label, level: 4, exact: true })
      .locator('xpath=ancestor::div[contains(@class, "row-span-2") or contains(@class, "col-span-2")]');
  }

  /**
   * Get the node list within a bin.
   */
  getBinNodeList(label: string): Locator {
    return this.getBin(label).getByRole('listbox');
  }

  /**
   * Get a node in the drawer by its label.
   */
  getNodeInDrawer(label: string): Locator {
    return this.page.getByRole('button', { name: label }).first();
  }

  /**
   * Get a node within a specific bin.
   */
  getNodeInBin(nodeLabel: string, binLabel: string): Locator {
    return this.getBin(binLabel).getByRole('option', { name: nodeLabel });
  }

  /**
   * Check if a node is in a specific bin.
   */
  async isNodeInBin(nodeLabel: string, binLabel: string): Promise<boolean> {
    return this.getNodeInBin(nodeLabel, binLabel).isVisible();
  }

  /**
   * Drag a node from the drawer to a bin.
   */
  async dragNodeToBin(nodeLabel: string, binLabel: string): Promise<void> {
    const node = this.getNodeInDrawer(nodeLabel);
    const bin = this.getBinNodeList(binLabel);

    await expect(node).toBeVisible();
    await expect(bin).toBeVisible();

    // Get bounding boxes
    const sourceBox = await node.boundingBox();
    const targetBox = await bin.boundingBox();

    if (!sourceBox || !targetBox) {
      throw new Error('Could not get bounding boxes for drag operation');
    }

    // Calculate center points
    const sourceX = sourceBox.x + sourceBox.width / 2;
    const sourceY = sourceBox.y + sourceBox.height / 2;
    const targetX = targetBox.x + targetBox.width / 2;
    const targetY = targetBox.y + targetBox.height / 2;

    // Simulate pointer-based drag
    await this.page.mouse.move(sourceX, sourceY);
    await this.page.mouse.down();
    await this.page.mouse.move(sourceX + 10, sourceY - 10, { steps: 2 });
    await this.page.mouse.move(targetX, targetY, { steps: 10 });
    await this.page.mouse.up();

    // Wait for the drop animation to complete
    await this.page.waitForTimeout(300);
  }

  /**
   * Move a node from one bin to another.
   */
  async moveNodeBetweenBins(
    nodeLabel: string,
    fromBinLabel: string,
    toBinLabel: string,
  ): Promise<void> {
    const node = this.getNodeInBin(nodeLabel, fromBinLabel);
    const targetBin = this.getBinNodeList(toBinLabel);

    await expect(node).toBeVisible();
    await expect(targetBin).toBeVisible();

    // Get bounding boxes
    const sourceBox = await node.boundingBox();
    const targetBox = await targetBin.boundingBox();

    if (!sourceBox || !targetBox) {
      throw new Error('Could not get bounding boxes for drag operation');
    }

    // Calculate center points
    const sourceX = sourceBox.x + sourceBox.width / 2;
    const sourceY = sourceBox.y + sourceBox.height / 2;
    const targetX = targetBox.x + targetBox.width / 2;
    const targetY = targetBox.y + targetBox.height / 2;

    // Simulate pointer-based drag
    await this.page.mouse.move(sourceX, sourceY);
    await this.page.mouse.down();
    await this.page.mouse.move(sourceX + 10, sourceY + 10, { steps: 2 });
    await this.page.mouse.move(targetX, targetY, { steps: 10 });
    await this.page.mouse.up();

    // Wait for the drop animation to complete
    await this.page.waitForTimeout(300);
  }
}

/**
 * CategoricalBin fixture for categorical bin stages.
 *
 * Provides methods to interact with circular category bins and drag nodes into them.
 */
class CategoricalBinFixture {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get the prompt locator.
   * @param text - Optional text pattern to filter the prompt by content.
   */
  getPrompt(text?: string | RegExp): Locator {
    const prompt = this.page.getByTestId('prompt');
    return text ? prompt.filter({ hasText: text }) : prompt;
  }

  /**
   * Get the drawer toggle button showing uncategorized count.
   * The button has aria-label "Collapse drawer" or "Expand drawer".
   */
  get drawerToggle(): Locator {
    return this.page.getByRole('button', { name: /drawer/i });
  }

  /**
   * Get the number of uncategorized nodes from the drawer toggle text.
   */
  async getUncategorizedCount(): Promise<number> {
    const text = await this.drawerToggle.textContent();
    const match = /(\d+)\s*unplaced/.exec(text ?? '');
    return match ? parseInt(match[1]!, 10) : 0;
  }

  /**
   * Get a category bin by its label.
   * Categories are rendered as circular buttons with aria-label containing the label.
   */
  getBin(label: string): Locator {
    return this.page.getByRole('button', {
      name: new RegExp(`Category ${label}`),
    });
  }

  /**
   * Get the count of nodes in a category from its aria-label.
   */
  async getNodeCountInBin(label: string): Promise<number> {
    const bin = this.getBin(label);
    const ariaLabel = await bin.getAttribute('aria-label');
    const match = /(\d+)\s*items/.exec(ariaLabel ?? '');
    return match ? parseInt(match[1]!, 10) : 0;
  }

  /**
   * Check if a category bin is expanded.
   */
  async isBinExpanded(label: string): Promise<boolean> {
    const bin = this.getBin(label);
    const expanded = await bin.getAttribute('aria-expanded');
    return expanded === 'true';
  }

  /**
   * Expand a category bin by clicking it.
   */
  async expandBin(label: string): Promise<void> {
    const bin = this.getBin(label);
    if (!(await this.isBinExpanded(label))) {
      await bin.click();
      // Wait for expansion animation
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Collapse an expanded bin by clicking outside or on its header.
   */
  async collapseBin(label: string): Promise<void> {
    if (await this.isBinExpanded(label)) {
      // Click outside the bin to collapse
      await this.page.locator('.interface').click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Get a node in the drawer by its label.
   */
  getNodeInDrawer(label: string): Locator {
    return this.page.getByRole('button', { name: label }).first();
  }

  /**
   * Get a node within an expanded bin's node list.
   * Note: binLabel is used by callers to ensure the correct bin is expanded first.
   */
  getNodeInBin(nodeLabel: string, _binLabel: string): Locator {
    // When expanded, the bin contains a NodeList with options
    return this.page
      .locator('[class*="catbin-expanded"]')
      .getByRole('option', { name: nodeLabel });
  }

  /**
   * Drag a node from the drawer to a category bin.
   */
  async dragNodeToBin(nodeLabel: string, binLabel: string): Promise<void> {
    const node = this.getNodeInDrawer(nodeLabel);
    const bin = this.getBin(binLabel);

    await expect(node).toBeVisible();
    await expect(bin).toBeVisible();

    // Get bounding boxes
    const sourceBox = await node.boundingBox();
    const targetBox = await bin.boundingBox();

    if (!sourceBox || !targetBox) {
      throw new Error('Could not get bounding boxes for drag operation');
    }

    // Calculate center points
    const sourceX = sourceBox.x + sourceBox.width / 2;
    const sourceY = sourceBox.y + sourceBox.height / 2;
    const targetX = targetBox.x + targetBox.width / 2;
    const targetY = targetBox.y + targetBox.height / 2;

    // Simulate pointer-based drag
    await this.page.mouse.move(sourceX, sourceY);
    await this.page.mouse.down();
    await this.page.mouse.move(sourceX + 10, sourceY - 10, { steps: 2 });
    await this.page.mouse.move(targetX, targetY, { steps: 10 });
    await this.page.mouse.up();

    // Wait for the drop animation to complete
    await this.page.waitForTimeout(300);
  }

  /**
   * Move a node from one bin to another.
   * Requires expanding the source bin first.
   */
  async moveNodeBetweenBins(
    nodeLabel: string,
    fromBinLabel: string,
    toBinLabel: string,
  ): Promise<void> {
    // Expand the source bin to access the node
    await this.expandBin(fromBinLabel);

    const node = this.getNodeInBin(nodeLabel, fromBinLabel);
    const targetBin = this.getBin(toBinLabel);

    await expect(node).toBeVisible();
    await expect(targetBin).toBeVisible();

    // Get bounding boxes
    const sourceBox = await node.boundingBox();
    const targetBox = await targetBin.boundingBox();

    if (!sourceBox || !targetBox) {
      throw new Error('Could not get bounding boxes for drag operation');
    }

    // Calculate center points
    const sourceX = sourceBox.x + sourceBox.width / 2;
    const sourceY = sourceBox.y + sourceBox.height / 2;
    const targetX = targetBox.x + targetBox.width / 2;
    const targetY = targetBox.y + targetBox.height / 2;

    // Simulate pointer-based drag
    await this.page.mouse.move(sourceX, sourceY);
    await this.page.mouse.down();
    await this.page.mouse.move(sourceX + 10, sourceY + 10, { steps: 2 });
    await this.page.mouse.move(targetX, targetY, { steps: 10 });
    await this.page.mouse.up();

    // Wait for the drop animation to complete
    await this.page.waitForTimeout(300);

    // Collapse any expanded bin
    await this.collapseBin(fromBinLabel);
  }
}

/**
 * Node Panel fixture for side panel interactions.
 */
class NodePanelFixture {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get the side panel locator.
   */
  get panel(): Locator {
    return this.page.getByTestId('node-panel');
  }

  /**
   * Get a node from the side panel by its label.
   */
  getNode(label: string): Locator {
    return this.panel.getByRole('option', { name: label });
  }

  /**
   * Drag a node from the side panel to the main node list.
   *
   * This app uses a custom pointer-based drag and drop implementation,
   * not HTML5 DnD. We need to simulate pointer events manually:
   * 1. pointerdown on source
   * 2. pointermove with enough distance to exceed drag threshold (5px)
   * 3. pointermove to the target
   * 4. pointerup to drop
   */
  async dragNodeToMainList(label: string): Promise<void> {
    const nodeInPanel = this.getNode(label);
    const dropTarget = this.page.getByTestId('node-list');

    await expect(nodeInPanel).toBeVisible();
    await expect(dropTarget).toBeVisible();

    // Get bounding boxes
    const sourceBox = await nodeInPanel.boundingBox();
    const targetBox = await dropTarget.boundingBox();

    if (!sourceBox || !targetBox) {
      throw new Error('Could not get bounding boxes for drag operation');
    }

    // Calculate center points
    const sourceX = sourceBox.x + sourceBox.width / 2;
    const sourceY = sourceBox.y + sourceBox.height / 2;
    const targetX = targetBox.x + targetBox.width / 2;
    const targetY = targetBox.y + targetBox.height / 2;

    // Simulate pointer-based drag:
    // 1. Move to source and press
    await this.page.mouse.move(sourceX, sourceY);
    await this.page.mouse.down();

    // 2. Move a small amount to exceed the drag threshold (5px)
    await this.page.mouse.move(sourceX + 10, sourceY + 10, { steps: 2 });

    // 3. Move to the target location
    await this.page.mouse.move(targetX, targetY, { steps: 10 });

    // 4. Release to drop
    await this.page.mouse.up();

    // Wait for the drop animation to complete
    await this.page.waitForTimeout(300);
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
  readonly form: FormFixture;
  readonly nameGenerator: NameGeneratorFixture;
  readonly nodePanel: NodePanelFixture;
  readonly sociogram: SociogramFixture;
  readonly ordinalBin: OrdinalBinFixture;
  readonly categoricalBin: CategoricalBinFixture;

  constructor(page: Page) {
    this.page = page;
    this.quickAdd = new QuickAddFixture(page);
    this.form = new FormFixture(page);
    this.nameGenerator = new NameGeneratorFixture(page);
    this.nodePanel = new NodePanelFixture(page);
    this.sociogram = new SociogramFixture(page);
    this.ordinalBin = new OrdinalBinFixture(page);
    this.categoricalBin = new CategoricalBinFixture(page);
  }

  /**
   * Get a node by its label.
   * Nodes are rendered with role="option" in the node list.
   */
  getNode(label: string): Locator {
    return this.page.getByRole('option', { name: label });
  }

  /**
   * Delete a node using keyboard navigation.
   *
   * Uses Ctrl+D to initiate drag mode, arrow keys to navigate
   * to the delete bin, and Enter to drop.
   */
  async deleteNode(label: string): Promise<void> {
    const node = this.getNode(label);

    await node.focus();
    await node.press('Control+d');

    // Navigate to the delete bin
    for (let i = 0; i < 10; i++) {
      await this.page.keyboard.press('ArrowDown');
      await this.page.waitForTimeout(100);
    }

    await this.page.keyboard.press('Enter');
    await node.waitFor({ state: 'hidden', timeout: 5000 });
  }
}
