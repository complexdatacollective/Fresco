import type { Locator } from '@playwright/test';

/**
 * Get the form field container by data-field-name attribute.
 */
function getFormField(container: Locator, fieldName: string): Locator {
  return container.locator(`[data-field-name="${fieldName}"]`);
}

/**
 * Get the input element within a form field.
 */
export function getFormFieldInput(
  container: Locator,
  fieldName: string,
): Locator {
  const field = getFormField(container, fieldName);
  return field.locator('input, textarea').first();
}

/**
 * Fill a form field by data-field-name attribute.
 */
export async function fillFormField(
  container: Locator,
  fieldName: string,
  value: string,
): Promise<void> {
  const input = getFormFieldInput(container, fieldName);
  await input.fill(value);
}
