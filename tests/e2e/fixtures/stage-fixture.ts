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
 * Navigate keyboard DnD to a specific drop target by reading announcements.
 *
 * @param page - Playwright Page instance
 * @param sourceLocator - The draggable node to pick up
 * @param targetText - Text to match within the DnD announcement. Pass the
 *   bin/target label — it appears in all announcement formats:
 *   - OrdinalBin: "Drop target 1 of 5: Container for the value 'Very close'"
 *   - CategoricalBin: "Drop target 1 of 3: Category: Cisgender Male"
 *   - Delete bin: "Drop target X of Y: Delete bin"
 * @param maxSteps - Maximum arrow presses before giving up (default 20)
 */
async function navigateDndToTarget(
  page: Page,
  sourceLocator: Locator,
  targetText: string,
  maxSteps = 20,
): Promise<void> {
  // Must use evaluate for focus — nodes have tabIndex=-1 (roving tabindex)
  // and Playwright's .focus() fails silently in WebKit for unfocusable elements.
  await sourceLocator.evaluate((el) => (el as HTMLElement).focus());
  await sourceLocator.press('Control+d');

  // After Ctrl+D, the DnD system creates a visual clone of the dragged node,
  // so sourceLocator may resolve to 2 elements. Use page.keyboard for
  // subsequent presses since focus is already established.
  let found = false;
  for (let i = 0; i < maxSteps; i++) {
    await page.keyboard.press('ArrowRight');
    const announcement = await getDndAnnouncement(page);
    if (announcement.includes(targetText)) {
      found = true;
      break;
    }
  }

  if (!found) {
    throw new Error(
      `Could not find DnD target "${targetText}" after ${maxSteps} steps`,
    );
  }

  await page.keyboard.press('Enter');
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
   * Select a value on a LikertScale field using keyboard navigation.
   *
   * LikertScale renders as a native range input (role="slider") with an
   * aria-label that reflects the current option. We press Home to go to
   * index 0, then ArrowRight until the aria-label matches the target.
   */
  async selectLikert(fieldName: string, optionLabel: string): Promise<void> {
    const field = this.getField(fieldName);
    const slider = field.getByRole('slider');
    const max = Number(await slider.getAttribute('max'));

    await slider.focus();
    await slider.press('Home');

    // Arrow right until we find the target label (max steps = option count).
    // After each key press, wait for the aria-label to update before reading
    // — WebKit can lag behind on attribute updates after synthetic key events.
    for (let i = 0; i <= max; i++) {
      await expect(slider).toHaveAttribute('aria-label', /.+/);
      const label = await slider.getAttribute('aria-label');
      if (label?.trim().includes(optionLabel)) {
        return;
      }
      if (i < max) {
        await slider.press('ArrowRight');
      }
    }

    const finalLabel = await slider.getAttribute('aria-label');
    throw new Error(
      `LikertScale option "${optionLabel}" not found in field ${fieldName}. ` +
        `Final aria-label: "${finalLabel}"`,
    );
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
   * Wait for the force simulation to settle. In e2e mode the worker is
   * mocked with a deterministic grid layout that emits `end` on the
   * first tick, so this resolves almost instantly — call before taking
   * a visual snapshot of a sociogram stage.
   */
  async waitForSimulationSettled(): Promise<void> {
    const sociogram = this.page.getByTestId('sociogram');
    await expect(sociogram).toHaveAttribute(
      'data-simulation-running',
      'false',
      { timeout: 15000 },
    );
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
    const edgesBefore = await this.getEdgeCount();

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
    // Wait for edge count to change (works for both connect and disconnect)
    await expect.poll(() => this.getEdgeCount()).not.toBe(edgesBefore);
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
    return this.page.locator('[data-testid^="ordinal-bin-"]').filter({
      has: this.page.getByRole('heading', {
        name: label,
        level: 4,
        exact: true,
      }),
    });
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
    await expect(node).toBeVisible();

    await navigateDndToTarget(this.page, node, binLabel);

    await expect(this.getNodeInDrawer(nodeLabel)).not.toBeVisible();
    await expect(this.getNodeInBin(nodeLabel, binLabel)).toBeVisible();
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

    await navigateDndToTarget(this.page, node, toBinLabel);

    await expect(this.getNodeInBin(nodeLabel, fromBinLabel)).not.toBeVisible();
    await expect(this.getNodeInBin(nodeLabel, toBinLabel)).toBeVisible();
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
   * Get the drawer toggle button showing uncategorized count.
   * The button has aria-label "Collapse drawer" or "Expand drawer".
   */
  get drawerToggle(): Locator {
    return this.page.getByRole('button', { name: /drawer/i });
  }

  /**
   * Get the number of uncategorized nodes from the drawer toggle text.
   */
  async getUnplacedCount(): Promise<number> {
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
    if (!(await this.isBinExpanded(label))) {
      await this.page
        .getByRole('button', { name: new RegExp(`Category ${label}`) })
        .click();
      await expect(
        this.page.locator('[class*="catbin-expanded"]'),
      ).toBeVisible();
    }
  }

  /**
   * Collapse an expanded bin by clicking the interface container.
   * The container's onClick calls setExpandedBinIndex(null) which collapses
   * any expanded bin. We cannot click the expanded header directly because
   * onToggleExpand only sets the same index (no-op), not a toggle.
   */
  async collapseBin(label: string): Promise<void> {
    if (await this.isBinExpanded(label)) {
      await this.page.getByTestId('categorical-bin-interface').click();
      await expect(
        this.page.locator('[class*="catbin-expanded"]'),
      ).not.toBeVisible();
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
  getNodeInBin(nodeLabel: string, binLabel: string): Locator {
    const expandedBin = this.page.locator('[class*="catbin-expanded"]').filter({
      has: this.page.getByRole('button', {
        name: new RegExp(`Category ${binLabel}`),
        expanded: true,
      }),
    });
    return expandedBin.getByRole('option', { name: nodeLabel });
  }

  /**
   * Drag a node from the drawer to a category bin using keyboard DnD.
   */
  async dragNodeToBin(nodeLabel: string, binLabel: string): Promise<void> {
    const node = this.getNodeInDrawer(nodeLabel);
    const countBefore = await this.getNodeCountInBin(binLabel);

    await expect(node).toBeVisible();

    await navigateDndToTarget(this.page, node, binLabel);

    await expect(this.getNodeInDrawer(nodeLabel)).not.toBeVisible();
    await expect
      .poll(() => this.getNodeCountInBin(binLabel))
      .toBeGreaterThan(countBefore);
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
    const countBefore = await this.getNodeCountInBin(toBinLabel);
    await expect(node).toBeVisible();

    await navigateDndToTarget(this.page, node, toBinLabel);

    await expect(this.getNodeInBin(nodeLabel, fromBinLabel)).not.toBeVisible();
    await expect
      .poll(() => this.getNodeCountInBin(toBinLabel))
      .toBeGreaterThan(countBefore);

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
   * Wait for the map to reach idle state — all tiles rendered and all
   * animations/transitions completed. Use this before taking snapshots
   * or after any map interaction (zoom, fly-to, search selection).
   *
   * In E2E stub mode (webkit/firefox), the container exposes
   * `data-geospatial-stub="true"` and there is no Mapbox canvas. The
   * stub sets `data-map-idle="true"` once the GeoJSON is fetched, so
   * we just wait on that attribute.
   */
  async waitForMapIdle(): Promise<void> {
    const isStub =
      (await this.mapContainer.getAttribute('data-geospatial-stub')) === 'true';
    if (isStub) {
      await expect(this.mapContainer).toHaveAttribute('data-map-idle', 'true', {
        timeout: 30000,
      });
      return;
    }

    const canvas = this.mapContainer.locator('canvas.mapboxgl-canvas');
    await expect(canvas).toBeVisible({ timeout: 30000 });
    await expect(this.mapContainer).toHaveAttribute('data-map-idle', 'true', {
      timeout: 30000,
    });
  }

  /**
   * Stronger stabilisation than waitForMapIdle: additionally verify
   * that the configured GeoJSON layer has features in its source AND
   * has rendered features on the visible canvas, by querying the live
   * mapbox instance via window.__e2eMap (populated only when
   * NEXT_PUBLIC_E2E_TEST is set).
   *
   * On webkit, mapbox-gl 3.21 sometimes reports the layer as rendered
   * (queryRenderedFeatures > 0) while the layer's pixels are not
   * actually composited to the visible canvas. After the readiness
   * check passes we explicitly force a paint cycle (resize +
   * triggerRepaint) and wait for the next idle event, which on webkit
   * reliably flushes the stale frame.
   *
   * In E2E stub mode the stub component fetches the GeoJSON itself
   * before flipping data-map-idle, so waitForMapIdle is sufficient.
   */
  async waitForGeoJsonRendered(): Promise<void> {
    const isStub =
      (await this.mapContainer.getAttribute('data-geospatial-stub')) === 'true';
    if (isStub) {
      await this.waitForMapIdle();
      return;
    }

    await this.waitForMapIdle();
    await this.page.waitForFunction(
      () => {
        const map = window.__e2eMap;
        if (!map) return false;
        if (!map.getSource('geojson-data')) return true; // no source configured
        if (!map.isSourceLoaded('geojson-data')) return false;
        if (map.querySourceFeatures('geojson-data').length === 0) return false;
        return map.queryRenderedFeatures({ layers: ['outline'] }).length > 0;
      },
      null,
      { timeout: 30000 },
    );

    // Force a fresh paint cycle and wait for it to complete.
    await this.page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const map = window.__e2eMap;
          if (!map) return resolve();
          map.once('idle', () => resolve());
          map.resize();
          map.triggerRepaint();
        }),
    );
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

    await this.waitForMapIdle();
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

    await this.waitForMapIdle();
  }

  /**
   * Click the recenter button to reset map to initial position.
   */
  async recenter(): Promise<void> {
    await this.recenterButton.click();
    await this.waitForMapIdle();
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
    await this.waitForMapIdle();
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
    // After Ctrl+D, DnD creates a visual clone so the locator may match 2
    // elements. Use page.keyboard since focus is already established.
    await this.page.keyboard.press('ArrowRight');
    await this.page.keyboard.press('Enter');

    await expect(
      this.page.getByTestId('node-list').getByRole('option', { name: label }),
    ).toBeVisible();
  }
}

/**
 * Placeholder fixture for DyadCensus stages.
 *
 * DyadCensus iterates through all node pairs with a binary Yes/No choice
 * to create edges. Has an introduction panel and auto-advances (350ms)
 * after each selection.
 *
 * TODO: Implement interaction methods:
 * - dismissIntro() — click next to dismiss intro panel
 * - selectYes() / selectNo() — click boolean option
 * - getPairLabels() — get the two node labels currently displayed
 * - waitForAutoAdvance() — wait for 350ms auto-advance
 */
class DyadCensusFixture {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }
}

/**
 * Placeholder fixture for TieStrengthCensus stages.
 *
 * Similar to DyadCensus but with multiple ordinal options instead of
 * binary Yes/No. Creates/updates edges with an ordinal attribute value.
 * Has introduction panel and auto-advances (350ms).
 *
 * TODO: Implement interaction methods:
 * - dismissIntro() — click next to dismiss intro panel
 * - selectOption(label) — click an ordinal option button
 * - selectNegative() — click the negative/no option
 * - getPairLabels() — get the two node labels currently displayed
 * - waitForAutoAdvance() — wait for 350ms auto-advance
 */
class TieStrengthCensusFixture {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }
}

/**
 * Placeholder fixture for OneToManyDyadCensus stages.
 *
 * Shows one source node and a grid of target nodes. Users click targets
 * to toggle edges. No introduction panel, no auto-advance.
 *
 * TODO: Implement interaction methods:
 * - getSourceNode() — get the current source node label
 * - getTargetNodes() — get all target node locators
 * - toggleTarget(label) — click a target node to toggle edge
 * - isTargetSelected(label) — check if a target has an edge to source
 */
class OneToManyDyadCensusFixture {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }
}

/**
 * Placeholder fixture for NameGeneratorRoster stages.
 *
 * Presents a searchable/sortable roster of pre-defined nodes.
 * Users select nodes from the roster to add to the network.
 *
 * TODO: Implement interaction methods:
 * - search(query) — type in the roster filter input
 * - clearSearch() — clear the filter
 * - getRosterNode(label) — get a node from the roster panel
 * - selectRosterNode(label) — click to add node to network
 * - sort() — toggle sort order
 */
class NameGeneratorRosterFixture {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }
}

/**
 * Placeholder fixture for Narrative stages.
 *
 * Read-only visualization with optional drawing annotations,
 * preset switching, convex hulls, and edge display toggles.
 * Does not mutate the network.
 *
 * TODO: Implement interaction methods:
 * - selectPreset(index) — switch visualization preset
 * - toggleDrawing() — enable/disable free drawing mode
 * - toggleEdges() — show/hide edge display
 * - toggleFreeze() — freeze/unfreeze layout
 */
class NarrativeFixture {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }
}

/**
 * Placeholder fixture for Anonymisation stages.
 *
 * Collects a passphrase to encrypt participant names marked as
 * encrypted in the codebook.
 *
 * TODO: Implement interaction methods:
 * - fillPassphrase(value) — fill the passphrase input
 * - fillConfirmPassphrase(value) — fill the confirm input
 * - submit() — submit the passphrase form
 * - isEncrypted() — check if encryption has been applied
 */
class AnonymisationFixture {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }
}

/**
 * Placeholder fixture for SlidesForm stages (AlterForm, AlterEdgeForm).
 *
 * Manages introduction panel and slide-per-item navigation for form stages
 * that iterate over nodes (AlterForm) or edges (AlterEdgeForm).
 * Field interactions are handled by FormFixture.
 *
 * TODO: Implement interaction methods:
 * - dismissIntro() — advance past the introduction panel
 * - getCurrentItemLabel() — get the label of the current node/edge
 * - getSlideIndex() — get current slide position
 * - isOnIntro() — check if intro panel is displayed
 */
class SlidesFormFixture {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }
}

/**
 * Placeholder fixture for FamilyPedigree stages.
 *
 * Multi-step wizard (15 steps) for building family tree data.
 * Creates multiple node types and edge types for family relationships.
 *
 * TODO: Implement interaction methods:
 * - getWizardStep() — get current wizard step
 * - advanceWizard() — advance to next wizard step
 * - getPedigreeView() — get the pedigree visualization locator
 * - getNodeCount() — count non-ego nodes in pedigree
 */
class FamilyPedigreeFixture {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
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
  readonly dyadCensus: DyadCensusFixture;
  readonly tieStrengthCensus: TieStrengthCensusFixture;
  readonly oneToManyDyadCensus: OneToManyDyadCensusFixture;
  readonly nameGeneratorRoster: NameGeneratorRosterFixture;
  readonly narrative: NarrativeFixture;
  readonly anonymisation: AnonymisationFixture;
  readonly slidesForm: SlidesFormFixture;
  readonly familyPedigree: FamilyPedigreeFixture;

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
    this.dyadCensus = new DyadCensusFixture(page);
    this.tieStrengthCensus = new TieStrengthCensusFixture(page);
    this.oneToManyDyadCensus = new OneToManyDyadCensusFixture(page);
    this.nameGeneratorRoster = new NameGeneratorRosterFixture(page);
    this.narrative = new NarrativeFixture(page);
    this.anonymisation = new AnonymisationFixture(page);
    this.slidesForm = new SlidesFormFixture(page);
    this.familyPedigree = new FamilyPedigreeFixture(page);
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

    await navigateDndToTarget(this.page, node, 'Delete bin');

    await node.waitFor({ state: 'hidden', timeout: 5000 });
  }
}
