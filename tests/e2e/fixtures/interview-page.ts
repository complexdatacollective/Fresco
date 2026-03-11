import { expect, type Locator, type Page } from '@playwright/test';

export type InterviewMode = 'preview' | 'interview';

export type StageInfo = {
  index: number;
  type: string;
  label: string;
  id: string;
};

/**
 * Page object for interacting with interview/preview pages.
 * Provides navigation controls and stage information access.
 */
export class InterviewPage {
  readonly page: Page;
  readonly mode: InterviewMode;
  readonly id: string;

  // Navigation locators
  readonly nextButton: Locator;
  readonly backButton: Locator;
  readonly navigation: Locator;

  constructor(page: Page, mode: InterviewMode, id: string) {
    this.page = page;
    this.mode = mode;
    this.id = id;

    this.navigation = page.getByRole('navigation');
    this.nextButton = this.navigation.getByRole('button', {
      name: 'Next Step',
    });
    this.backButton = this.navigation.getByRole('button', {
      name: 'Previous Step',
    });
  }

  /**
   * Navigate to the interview/preview page and wait for it to load.
   */
  async start(): Promise<void> {
    const url =
      this.mode === 'preview'
        ? `/preview/${this.id}/interview`
        : `/interview/${this.id}`;

    await this.page.goto(url);

    // Wait for navigation to be ready
    await expect(this.nextButton).toBeVisible();
  }

  /**
   * Get the current step from the URL query parameter.
   */
  getCurrentStep(): number {
    const url = new URL(this.page.url());
    const step = url.searchParams.get('step');
    return step ? parseInt(step, 10) : 0;
  }

  /**
   * Navigate to the next stage/prompt.
   * Waits for the next button to be enabled before clicking.
   */
  async navigateNext(): Promise<void> {
    // Wait for button to be enabled (form validation, animations complete)
    await expect(this.nextButton).toBeEnabled({ timeout: 10000 });
    await this.nextButton.click();

    // Wait for navigation to complete (URL changes or stage animation)
    await this.page.waitForTimeout(300); // Allow for animation
  }

  /**
   * Navigate to the previous stage/prompt.
   */
  async navigateBack(): Promise<void> {
    await expect(this.backButton).toBeEnabled({ timeout: 5000 });
    await this.backButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Check if the next button is currently enabled.
   */
  async canNavigateNext(): Promise<boolean> {
    return this.nextButton.isEnabled();
  }

  /**
   * Check if the back button is currently enabled.
   */
  async canNavigateBack(): Promise<boolean> {
    return this.backButton.isEnabled();
  }

  /**
   * Wait for the next button to become enabled.
   * Useful after filling forms or meeting stage requirements.
   */
  async waitForNextEnabled(timeout = 10000): Promise<void> {
    await expect(this.nextButton).toBeEnabled({ timeout });
  }

  /**
   * Check if the interview has finished (reached the end).
   * This is detected by checking if we're redirected away from the interview.
   */
  isFinished(): boolean {
    const url = this.page.url();
    // Interview finishes when redirected to finish page or back to dashboard
    return (
      url.includes('/finish') ||
      url.includes('/dashboard') ||
      url.includes('/thankyou')
    );
  }

  /**
   * Get the stage interface container.
   * Different stage types use different containers:
   * - Most stages: .interface class
   * - Geospatial: #map-container
   */
  getStageContainer(): Locator {
    return this.page
      .locator('.interface, [class*="Interface"], #map-container')
      .first();
  }

  /**
   * Wait for stage content to be visible.
   */
  async waitForStageContent(): Promise<void> {
    await expect(this.getStageContainer()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get a form field by its data-field-name attribute.
   */
  getField(fieldName: string): Locator {
    return this.page.locator(`[data-field-name="${fieldName}"]`);
  }

  /**
   * Fill a text input field.
   */
  async fillTextField(fieldName: string, value: string): Promise<void> {
    const field = this.getField(fieldName);
    const input = field.locator('input, textarea').first();
    await input.fill(value);
  }

  /**
   * Fill a form field, auto-detecting the field type.
   * Supports: text inputs, textareas, radio groups, checkbox groups, toggle button groups, spinbuttons.
   */
  async fillFormField(fieldName: string, value: string): Promise<void> {
    const field = this.getField(fieldName);
    await expect(field).toBeVisible({ timeout: 5000 });

    // Check for spinbutton (NumberCounterField)
    const spinbutton = field.getByRole('spinbutton');
    if ((await spinbutton.count()) > 0) {
      const targetValue = parseInt(value, 10);
      // Get current value from aria-valuenow
      const currentValueStr = await spinbutton.getAttribute('aria-valuenow');
      const currentValue = currentValueStr ? parseInt(currentValueStr, 10) : 0;

      // Focus the spinbutton and use keyboard navigation
      await spinbutton.focus();

      const diff = targetValue - currentValue;
      if (diff > 0) {
        // Press ArrowUp to increment
        for (let i = 0; i < diff; i++) {
          await spinbutton.press('ArrowUp');
        }
      } else if (diff < 0) {
        // Press ArrowDown to decrement
        for (let i = 0; i < Math.abs(diff); i++) {
          await spinbutton.press('ArrowDown');
        }
      }

      // Blur to trigger validation
      await spinbutton.blur();
      return;
    }

    // Check for radio buttons first (most common for categorical fields)
    const radioOption = field.getByRole('radio', {
      name: new RegExp(value, 'i'),
    });
    if ((await radioOption.count()) > 0) {
      await radioOption.click();
      return;
    }

    // Check for checkbox options (ToggleButtonGroup uses checkbox role)
    const checkboxOption = field.getByRole('checkbox', {
      name: new RegExp(value, 'i'),
    });
    if ((await checkboxOption.count()) > 0) {
      await checkboxOption.click();
      return;
    }

    // Check for buttons containing the value text (ToggleButtonGroup fallback)
    // The button might not have the accessible name but contains the text
    const buttonWithText = field
      .getByRole('button')
      .filter({ hasText: new RegExp(value, 'i') });
    if ((await buttonWithText.count()) > 0) {
      await buttonWithText.first().click();
      return;
    }

    // Check for text input or textarea
    const textInput = field
      .locator(
        'input[type="text"], input[type="number"], input:not([type]), textarea',
      )
      .first();
    if ((await textInput.count()) > 0) {
      // Use fill() which properly triggers React onChange events
      await textInput.fill(value);
      // Blur to trigger onBlur validation
      await textInput.blur();
      return;
    }

    // Fallback: try clicking any element with matching text (label-based selection)
    const labelWithText = field
      .locator('label, span')
      .filter({ hasText: new RegExp(`^${value}`, 'i') });
    if ((await labelWithText.count()) > 0) {
      await labelWithText.first().click();
      return;
    }

    // Last resort: try any input
    const anyInput = field.locator('input, textarea').first();
    if ((await anyInput.count()) > 0) {
      const inputType = await anyInput.getAttribute('type');
      if (inputType === 'checkbox' || inputType === 'radio') {
        await anyInput.click();
      } else {
        await anyInput.fill(value);
      }
      return;
    }

    throw new Error(
      `Could not find a way to fill field "${fieldName}" with value "${value}"`,
    );
  }

  /**
   * Select a radio option by clicking the label.
   */
  async selectRadioOption(
    fieldName: string,
    optionLabel: string,
  ): Promise<void> {
    const field = this.getField(fieldName);
    // Find the radio option by its label text
    const option = field.getByRole('radio', { name: optionLabel });
    await option.click();
  }

  /**
   * Toggle a checkbox/switch.
   */
  async toggleCheckbox(fieldName: string): Promise<void> {
    const field = this.getField(fieldName);
    const checkbox = field.getByRole('checkbox').or(field.getByRole('switch'));
    await checkbox.click();
  }

  /**
   * Select an option from a dropdown/combobox.
   */
  async selectDropdownOption(
    fieldName: string,
    optionLabel: string,
  ): Promise<void> {
    const field = this.getField(fieldName);
    const combobox = field.getByRole('combobox');
    await combobox.click();
    await this.page.getByRole('option', { name: optionLabel }).click();
  }

  /**
   * Check multiple checkboxes in a checkbox group.
   */
  async selectCheckboxOptions(
    fieldName: string,
    optionLabels: string[],
  ): Promise<void> {
    const field = this.getField(fieldName);
    for (const label of optionLabels) {
      const checkbox = field.getByRole('checkbox', { name: label });
      await checkbox.check();
    }
  }

  // ============================================================
  // Stage-specific helpers
  // ============================================================

  /**
   * Add a node using the quick add interface (NameGeneratorQuickAdd).
   * The QuickAddField uses a circular toggle button that expands to show an input.
   */
  async quickAddNode(name: string): Promise<void> {
    // The QuickAddField uses a circular toggle button with data-toggle-circle inside
    // Find the button that contains the toggle circle element
    const toggleButton = this.page.locator('button:has([data-toggle-circle])');

    // Click to expand the input field
    await toggleButton.click();

    // Wait for the input to appear (it animates in with autoFocus)
    const input = this.page.getByRole('textbox');
    await expect(input).toBeVisible({ timeout: 5000 });

    // Fill the input and press Enter to submit
    await input.fill(name);
    await input.press('Enter');

    // Wait for the node to be added and the celebration animation
    await this.page.waitForTimeout(500);
  }

  /**
   * Add a node using the full form interface (NameGenerator).
   * This interface opens a dialog/form for detailed node entry.
   * @param formData - Object mapping field names to values
   */
  async addNodeWithForm(formData: Record<string, string>): Promise<void> {
    // The NodeForm uses a circular button with data-toggle-circle and aria-label="Add a person"
    const addButton = this.page.getByRole('button', { name: /add a person/i });

    // Wait for the button to be visible and click it
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    // Wait for dialog/form to appear
    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Fill form fields (field names are UUIDs from the protocol codebook)
    for (const [fieldName, value] of Object.entries(formData)) {
      await this.fillFormField(fieldName, value);
    }

    // Wait a bit for form validation to settle
    await this.page.waitForTimeout(500);

    // Submit the form (button says "Finished")
    const submitButton = dialog.getByRole('button', {
      name: /finished/i,
    });

    // Wait for button to be enabled (form validation)
    await expect(submitButton).toBeEnabled({ timeout: 5000 });

    // Click the submit button
    await submitButton.click();

    // Wait for dialog to close - if it doesn't close, try alternative submission methods
    try {
      await expect(dialog).not.toBeVisible({ timeout: 5000 });
    } catch {
      // Dialog didn't close - try pressing Enter on the submit button
      await submitButton.focus();
      await submitButton.press('Enter');
      await this.page.waitForTimeout(500);

      if (await dialog.isVisible()) {
        // Try clicking the form's submit button directly via JavaScript
        await submitButton.evaluate((btn) => {
          btn.click();
        });
        await this.page.waitForTimeout(500);
      }

      if (await dialog.isVisible()) {
        // Try submitting the form via requestSubmit
        const form = this.page.locator('form#node-form');
        if ((await form.count()) > 0) {
          await form.evaluate((f: HTMLFormElement) => {
            f.requestSubmit();
          });
          await this.page.waitForTimeout(500);
        }
      }

      await expect(dialog).not.toBeVisible({ timeout: 5000 });
    }
  }

  /**
   * Drag a node to a bin (OrdinalBin/CategoricalBin).
   */
  async dragNodeToBin(nodeName: string, binLabel: string): Promise<void> {
    const node = this.page
      .locator(`[class*="Node"]`)
      .filter({ hasText: nodeName });
    const bin = this.page
      .locator(`[class*="Bin"]`)
      .filter({ hasText: binLabel });

    await node.dragTo(bin);
    await this.page.waitForTimeout(300);
  }

  /**
   * Click on the geospatial map to select "Outside Selectable Areas".
   * This skips actual map selection for testing purposes.
   */
  async clickOutsideMapArea(): Promise<void> {
    const outsideButton = this.page.getByRole('button', {
      name: /outside selectable areas/i,
    });
    await expect(outsideButton).toBeVisible({ timeout: 10000 });
    await outsideButton.click();
    // Wait for the selection to be processed
    await this.page.waitForTimeout(500);
  }

  /**
   * Create an edge between two nodes in a sociogram.
   */
  async createSociogramEdge(
    sourceNodeName: string,
    targetNodeName: string,
  ): Promise<void> {
    const sourceNode = this.page
      .locator(`[class*="Node"]`)
      .filter({ hasText: sourceNodeName });
    const targetNode = this.page
      .locator(`[class*="Node"]`)
      .filter({ hasText: targetNodeName });

    // Click source, then target to create edge
    await sourceNode.click();
    await targetNode.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Advance through multiple prompts on a single stage.
   */
  async advanceThroughPrompts(count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.navigateNext();
    }
  }
}
