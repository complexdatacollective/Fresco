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
 * Stage fixture for e2e tests.
 *
 * Handles stage-specific elements and interactions.
 */
export class StageFixture {
  readonly page: Page;
  readonly quickAdd: QuickAddFixture;
  readonly form: FormFixture;
  readonly nameGenerator: NameGeneratorFixture;

  constructor(page: Page) {
    this.page = page;
    this.quickAdd = new QuickAddFixture(page);
    this.form = new FormFixture(page);
    this.nameGenerator = new NameGeneratorFixture(page);
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
