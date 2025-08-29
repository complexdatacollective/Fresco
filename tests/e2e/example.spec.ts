import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expects the page to have a title containing "Fresco"
  await expect(page).toHaveTitle(/Fresco/i);
});

test('visual regression example', async ({ page }) => {
  await page.goto('/');

  // Wait for content to load
  await page.waitForLoadState('networkidle');

  // Take a screenshot for visual regression testing
  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
