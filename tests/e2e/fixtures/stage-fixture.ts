import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Read the current DnD accessibility announcement from the live region.
 * The DnD system appends a div[role="status"][aria-live="polite"] to document.body
 * with text like "Drop target 1 of 5: Container for the value 'Very close '"
 */
async function getDndAnnouncement(page: Page): Promise<string> {
  return page.evaluate(() => {
    const statusElements = document.querySelectorAll(
      'body > div[role="status"][aria-live="polite"]',
    );
    for (const el of statusElements) {
      const text = el.textContent?.trim() ?? '';
      if (text.includes('Drop target')) {
        return text;
      }
    }
    return '';
  });
}

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
  async selectRadio(
    fieldName: string,
    optionLabel: string | RegExp,
    options?: { exact?: boolean },
  ): Promise<void> {
    const field = this.getField(fieldName);
    const radio = field.getByRole('radio', {
      name: optionLabel,
      exact: options?.exact ?? true,
    });
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
      .locator(
        'xpath=ancestor::div[contains(@class, "row-span-2") or contains(@class, "col-span-2")]',
      );
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
   * Drag a node from the drawer to a bin using keyboard DnD.
   */
  async dragNodeToBin(nodeLabel: string, binLabel: string): Promise<void> {
    const node = this.getNodeInDrawer(nodeLabel);
    const bin = this.getBinNodeList(binLabel);

    await expect(node).toBeVisible();
    await expect(bin).toBeVisible();

    // Use keyboard DnD (Ctrl+D, arrow keys, Enter) for cross-browser reliability.
    // Nodes have tabIndex=-1, so we must focus programmatically.
    await node.evaluate((el) => (el as HTMLElement).focus());
    await node.press('Control+d');

    // Navigate to the correct drop target by reading the DnD announcement.
    // OrdinalBin targets are announced as "Container for the value '<label>'"
    let found = false;
    for (let i = 0; i < 10; i++) {
      await node.press('ArrowRight');
      const announcement = await getDndAnnouncement(this.page);
      if (announcement.includes(binLabel)) {
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(
        `Could not navigate to ordinal bin "${binLabel}" via keyboard DnD`,
      );
    }

    await node.press('Enter');
    await this.page.waitForTimeout(300);
  }

  /**
   * Move a node from one bin to another using keyboard DnD.
   */
  async moveNodeBetweenBins(
    nodeLabel: string,
    fromBinLabel: string,
    toBinLabel: string,
  ): Promise<void> {
    const node = this.getNodeInBin(nodeLabel, fromBinLabel);

    await expect(node).toBeVisible();

    // Use keyboard DnD: focus the node in its current bin, then navigate to target.
    await node.evaluate((el) => (el as HTMLElement).focus());
    await node.press('Control+d');

    let found = false;
    for (let i = 0; i < 10; i++) {
      await node.press('ArrowRight');
      const announcement = await getDndAnnouncement(this.page);
      if (announcement.includes(toBinLabel)) {
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(
        `Could not navigate from bin "${fromBinLabel}" to bin "${toBinLabel}"`,
      );
    }

    await node.press('Enter');
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
   * Drag a node from the drawer to a category bin using keyboard DnD.
   */
  async dragNodeToBin(nodeLabel: string, binLabel: string): Promise<void> {
    const node = this.getNodeInDrawer(nodeLabel);
    const bin = this.getBin(binLabel);

    await expect(node).toBeVisible();
    await expect(bin).toBeVisible();

    await node.evaluate((el) => (el as HTMLElement).focus());
    await node.press('Control+d');

    // Navigate to the correct drop target by reading the DnD announcement.
    // CategoricalBin targets are announced as "Category: <label>"
    let found = false;
    for (let i = 0; i < 10; i++) {
      await node.press('ArrowRight');
      const announcement = await getDndAnnouncement(this.page);
      if (announcement.includes(binLabel)) {
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(`Could not navigate to category bin "${binLabel}"`);
    }

    await node.press('Enter');
    await this.page.waitForTimeout(300);
  }

  /**
   * Move a node from one bin to another using keyboard DnD.
   * Requires expanding the source bin first to access the node.
   */
  async moveNodeBetweenBins(
    nodeLabel: string,
    fromBinLabel: string,
    toBinLabel: string,
  ): Promise<void> {
    // Expand the source bin to access the node
    await this.expandBin(fromBinLabel);

    const node = this.getNodeInBin(nodeLabel, fromBinLabel);
    await expect(node).toBeVisible();

    await node.evaluate((el) => (el as HTMLElement).focus());
    await node.press('Control+d');

    let found = false;
    for (let i = 0; i < 10; i++) {
      await node.press('ArrowRight');
      const announcement = await getDndAnnouncement(this.page);
      if (announcement.includes(toBinLabel)) {
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(
        `Could not navigate from bin "${fromBinLabel}" to bin "${toBinLabel}"`,
      );
    }

    await node.press('Enter');
    await this.page.waitForTimeout(300);

    // Collapse any expanded bin
    await this.collapseBin(fromBinLabel);
  }
}

/**
 * Geospatial fixture for geospatial/map stages.
 *
 * Provides methods to interact with the map, search, zoom controls,
 * and map selection features.
 */
class GeospatialFixture {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get the map container locator.
   */
  get mapContainer(): Locator {
    return this.page.getByTestId('map-container');
  }

  /**
   * Get the map toolbar locator.
   */
  get toolbar(): Locator {
    return this.page.getByTestId('map-toolbar');
  }

  /**
   * Get the zoom in button locator.
   */
  get zoomInButton(): Locator {
    return this.page.getByTestId('map-zoom-in');
  }

  /**
   * Get the zoom out button locator.
   */
  get zoomOutButton(): Locator {
    return this.page.getByTestId('map-zoom-out');
  }

  /**
   * Get the recenter button locator.
   */
  get recenterButton(): Locator {
    return this.page.getByTestId('map-recenter');
  }

  /**
   * Get the search toggle button locator.
   */
  get searchToggle(): Locator {
    return this.page.getByTestId('geospatial-search-toggle');
  }

  /**
   * Get the "Outside Selectable Areas" button locator.
   */
  get outsideSelectableAreasButton(): Locator {
    return this.page.getByTestId('outside-selectable-areas-button');
  }

  /**
   * Get the overlay shown when "outside selectable areas" is selected.
   */
  get outsideSelectableOverlay(): Locator {
    return this.page.getByTestId('outside-selectable-overlay');
  }

  /**
   * Get the deselect button within the overlay.
   */
  get deselectButton(): Locator {
    return this.page.getByTestId('deselect-outside-area-button');
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
   * Wait for the Mapbox map to be fully loaded with all layers.
   * Checks for the data-map-loaded attribute which indicates all layers are ready.
   */
  async waitForMapLoad(): Promise<void> {
    // First wait for the canvas to render
    const canvas = this.mapContainer.locator('canvas.mapboxgl-canvas');
    await expect(canvas).toBeVisible({ timeout: 30000 });

    // Then wait for all layers to be loaded (data-map-loaded="true")
    await expect(this.mapContainer).toHaveAttribute('data-map-loaded', 'true', {
      timeout: 30000,
    });
  }

  /**
   * Check if the map has fully loaded with all layers.
   */
  async isMapLoaded(): Promise<boolean> {
    const attr = await this.mapContainer.getAttribute('data-map-loaded');
    return attr === 'true';
  }

  /**
   * Wait for the map canvas to be visible (basic map render, not layers).
   */
  async waitForMapCanvas(): Promise<void> {
    const canvas = this.mapContainer.locator('canvas.mapboxgl-canvas');
    await expect(canvas).toBeVisible({ timeout: 30000 });
  }

  /**
   * Get the current zoom level from the map container's data attribute.
   * Returns the zoom level or null if not available.
   */
  async getZoomLevel(): Promise<number | null> {
    const zoomAttr = await this.mapContainer.getAttribute('data-zoom-level');
    return zoomAttr ? parseFloat(zoomAttr) : null;
  }

  /**
   * Click the zoom in button and verify zoom level increased.
   */
  async zoomIn(): Promise<void> {
    const zoomBefore = await this.getZoomLevel();
    await this.zoomInButton.click();

    // Verify zoom increased
    if (zoomBefore !== null) {
      await expect
        .poll(() => this.getZoomLevel(), { timeout: 3000 })
        .toBeGreaterThan(zoomBefore);
    }
  }

  /**
   * Click the zoom out button and verify zoom level decreased.
   */
  async zoomOut(): Promise<void> {
    const zoomBefore = await this.getZoomLevel();
    await this.zoomOutButton.click();

    // Verify zoom decreased
    if (zoomBefore !== null) {
      await expect
        .poll(() => this.getZoomLevel(), { timeout: 3000 })
        .toBeLessThan(zoomBefore);
    }
  }

  /**
   * Click the recenter button to reset map to initial position.
   */
  async recenter(): Promise<void> {
    await this.recenterButton.click();
    // Wait for pan/zoom animation
    await this.page.waitForTimeout(500);
  }

  /**
   * Open the search panel by clicking the search toggle.
   */
  async openSearch(): Promise<void> {
    const isOpen = await this.isSearchOpen();
    if (!isOpen) {
      await this.searchToggle.click();
      // Wait for search panel to appear
      await expect(
        this.page.getByRole('combobox', { name: /search/i }),
      ).toBeVisible();
    }
  }

  /**
   * Close the search panel.
   */
  async closeSearch(): Promise<void> {
    const isOpen = await this.isSearchOpen();
    if (isOpen) {
      await this.searchToggle.click();
      // Wait for search panel to disappear
      await expect(
        this.page.getByRole('combobox', { name: /search/i }),
      ).not.toBeVisible();
    }
  }

  /**
   * Check if the search panel is open.
   */
  async isSearchOpen(): Promise<boolean> {
    const expanded = await this.searchToggle.getAttribute('aria-expanded');
    return expanded === 'true';
  }

  /**
   * Get the search input locator.
   */
  get searchInput(): Locator {
    return this.page.getByTestId('geospatial-search-input');
  }

  /**
   * Get the search clear button locator.
   */
  get searchClearButton(): Locator {
    return this.page.getByTestId('geospatial-search-clear');
  }

  /**
   * Search for a location by typing in the search input.
   * Waits for suggestions to appear after typing.
   * @param query - The search query to type
   */
  async search(query: string): Promise<void> {
    await this.openSearch();
    await this.searchInput.fill(query);
    // Wait for suggestions to appear (handles debounced API call)
    await expect(this.getSuggestions().first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get search suggestions list.
   */
  getSuggestions(): Locator {
    return this.page.getByRole('option');
  }

  /**
   * Select a search suggestion by its text.
   * @param text - The suggestion text to click
   */
  async selectSuggestion(text: string | RegExp): Promise<void> {
    const suggestion = this.page.getByRole('option', { name: text });
    await expect(suggestion).toBeVisible();
    await suggestion.click();
    // Wait for map to fly to location
    await this.page.waitForTimeout(1000);
  }

  /**
   * Clear the search input.
   */
  async clearSearch(): Promise<void> {
    if (await this.searchClearButton.isVisible()) {
      await this.searchClearButton.click();
      // Verify input is cleared
      await expect(this.searchInput).toHaveValue('');
    }
  }

  /**
   * Click the "Outside Selectable Areas" button.
   */
  async selectOutsideSelectableAreas(): Promise<void> {
    await this.outsideSelectableAreasButton.click();
    // Wait for overlay to appear
    await expect(this.outsideSelectableOverlay).toBeVisible();
  }

  /**
   * Deselect the "outside selectable areas" option.
   */
  async deselectOutsideArea(): Promise<void> {
    await this.deselectButton.click();
    // Wait for overlay to disappear
    await expect(this.outsideSelectableOverlay).not.toBeVisible();
  }

  /**
   * Check if "outside selectable areas" is currently selected.
   */
  async isOutsideSelectableAreasSelected(): Promise<boolean> {
    return this.outsideSelectableOverlay.isVisible();
  }

  /**
   * Click on the map at a specific position relative to the map container.
   * @param x - X coordinate (0-1 as percentage of width)
   * @param y - Y coordinate (0-1 as percentage of height)
   */
  async clickOnMap(x: number, y: number): Promise<void> {
    const box = await this.mapContainer.boundingBox();
    if (!box) {
      throw new Error('Map container not visible');
    }

    const clickX = box.x + box.width * x;
    const clickY = box.y + box.height * y;

    await this.page.mouse.click(clickX, clickY);
    // Wait for selection to register
    await this.page.waitForTimeout(300);
  }

  /**
   * Get the current node being displayed (from CollapsablePrompts).
   * @param label - The node label to find
   */
  getNode(label: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(`^${label}`) });
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
   * Drag a node from the side panel to the main node list using keyboard DnD.
   *
   * Uses the app's keyboard-accessible drag path (Ctrl+D to start, arrow keys
   * to navigate, Enter to drop) instead of pointer simulation, which fails
   * in WebKit due to setPointerCapture issues with synthetic events.
   */
  async dragNodeToMainList(label: string): Promise<void> {
    const nodeInPanel = this.getNode(label);
    const dropTarget = this.page.getByTestId('node-list');

    await expect(nodeInPanel).toBeVisible();
    await expect(dropTarget).toBeVisible();

    // Use keyboard DnD instead of pointer simulation because WebKit has issues
    // with setPointerCapture on synthetic pointer events from Playwright's mouse
    // API. The nodes have tabIndex=-1 (roving tabindex within a listbox), so we
    // must focus them programmatically rather than via Tab.
    await nodeInPanel.evaluate((el) => (el as HTMLElement).focus());
    await nodeInPanel.press('Control+d');
    await nodeInPanel.press('ArrowRight');
    await nodeInPanel.press('Enter');
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
  readonly geospatial: GeospatialFixture;

  constructor(page: Page) {
    this.page = page;
    this.quickAdd = new QuickAddFixture(page);
    this.form = new FormFixture(page);
    this.nameGenerator = new NameGeneratorFixture(page);
    this.nodePanel = new NodePanelFixture(page);
    this.sociogram = new SociogramFixture(page);
    this.ordinalBin = new OrdinalBinFixture(page);
    this.categoricalBin = new CategoricalBinFixture(page);
    this.geospatial = new GeospatialFixture(page);
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
