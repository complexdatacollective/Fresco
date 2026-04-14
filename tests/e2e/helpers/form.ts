import { expect, type Locator, type Page } from '@playwright/test';

function getField(page: Page, fieldName: string): Locator {
  return page.locator(`[data-field-name="${fieldName}"]`);
}

export async function fillField(
  page: Page,
  fieldName: string,
  value: string,
): Promise<void> {
  const field = getField(page, fieldName);
  const input = field.locator('input, textarea').first();
  // fill() focuses and types. Skipping click avoids webkit stability
  // timeouts on field-sizing-content inputs that re-layout on focus.
  await input.fill(value);
  await expect(input).toHaveValue(value);
}
