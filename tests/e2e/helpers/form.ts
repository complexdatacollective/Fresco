import { type Locator, type Page } from '@playwright/test';

export function getField(page: Page, fieldName: string): Locator {
  return page.locator(`[data-field-name="${fieldName}"]`);
}

export async function fillField(
  page: Page,
  fieldName: string,
  value: string,
): Promise<void> {
  const field = getField(page, fieldName);
  const input = field.locator('input, textarea').first();
  await input.fill(value);
}

export function getFieldInput(page: Page, fieldName: string): Locator {
  return getField(page, fieldName).locator('input, textarea').first();
}
