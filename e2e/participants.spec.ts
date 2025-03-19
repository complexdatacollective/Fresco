import { expect, test } from '@playwright/test';

test.describe('Participants page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/participants');
  });

  test('should display imported participants', async ({ page }) => {
    // check that our imported participants are visible
    await expect(page.locator('text=Christopher Lee')).toHaveText(
      'Christopher Lee',
    );
    await expect(page.locator('text=Emily Brown')).toHaveText('Emily Brown');
  });

  test('should match visual snapshot', async ({ page }) => {
    // validate screenshot
    await expect(page).toHaveScreenshot('participants-page.png');
  });
});
