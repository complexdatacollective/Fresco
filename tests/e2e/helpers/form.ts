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
  // WebKit's field-sizing-content triggers a re-layout on focus that can
  // race with fill() and clear the value. Retry once if that happens.
  await input.fill(value);
  const actual = await input.inputValue();
  if (actual !== value) {
    await input.fill(value);
  }
  await expect(input).toHaveValue(value);
}
