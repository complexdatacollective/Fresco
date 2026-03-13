import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Navigate to an interview stage by index.
 *
 * @param page - Playwright page
 * @param interviewId - The interview ID
 * @param stageIndex - The stage index (0-based)
 */
export async function gotoStage(
  page: Page,
  interviewId: string,
  stageIndex: number,
): Promise<void> {
  await page.goto(`/interview/${interviewId}?step=${stageIndex}`);
  await waitForStageLoad(page);
}

/**
 * Wait for the interview stage to be fully loaded.
 *
 * @param page - Playwright page
 */
export async function waitForStageLoad(page: Page): Promise<void> {
  // Wait for the interview container to be visible
  // The interview layout renders <main data-interview>
  const mainLocator = page.locator('main[data-interview]');

  try {
    await expect(mainLocator).toBeVisible({ timeout: 15000 });
  } catch (error) {
    // Capture diagnostic info on failure
    const url = page.url();
    const title = await page.title();
    const bodyText = await page.locator('body').textContent().catch(() => 'N/A');

    const diagnostics = [
      `Interview stage load failed`,
      `URL: ${url}`,
      `Title: ${title}`,
      `Body content (truncated): ${bodyText?.slice(0, 500) ?? 'empty'}`,
    ].join('\n');

    throw new Error(`${diagnostics}\n\nOriginal error: ${String(error)}`);
  }
}

/**
 * Get the next button locator.
 *
 * @param page - Playwright page
 */
export function getNextButton(page: Page): Locator {
  return page.getByTestId('next-button');
}
