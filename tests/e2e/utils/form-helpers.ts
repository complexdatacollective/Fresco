import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Get a form field's container element by its field name.
 * Targets the `data-field-name` attribute set by the form system's Field component.
 */
export function getFormField(
  container: Page | Locator,
  fieldName: string,
): Locator {
  return container.locator(`[data-field-name="${fieldName}"]`);
}

/**
 * Get the input or textarea element within a named form field.
 * Useful when you need direct access to the element (e.g. to call .blur()).
 */
export function getFormFieldInput(
  container: Page | Locator,
  fieldName: string,
): Locator {
  return getFormField(container, fieldName).locator('input, textarea').first();
}

/**
 * Fill a text input or textarea within a named form field.
 */
export async function fillFormField(
  container: Page | Locator,
  fieldName: string,
  value: string,
): Promise<void> {
  const input = getFormFieldInput(container, fieldName);
  await expect(input).toBeVisible();
  await input.fill(value);
}
