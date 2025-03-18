import { expect } from '@playwright/test';
import { test } from './fixtures/signIn';

test.describe('Protocols page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/protocols");
  });

  test('should display uploaded protocol', async ({ page }) => {
    // check that our uploaded protocol is visible
    await expect(page.locator('text=SampleProtocol.netcanvas')).toHaveText('SampleProtocol.netcanvas');
  });

  test('should match visual snapshot', async ({ page }) => {
    // validate screenshot
    await expect(page).toHaveScreenshot('protocols-page.png');
  });
});