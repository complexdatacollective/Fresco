import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads and has expected content
    await expect(page).toHaveTitle(/Fresco/);
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'tests/e2e/test-results/homepage-smoke.png' });
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    
    // This test will be expanded in later phases
    // For now, just verify basic page structure
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});