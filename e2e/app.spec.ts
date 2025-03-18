
import { expect } from '@playwright/test';
import { test } from './fixtures/signIn';

test('should visit protocols page ', async ({ page }) => {

  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

  // click "protocols" in the top navigation
  await page.click('text=Protocols');
  await expect(page).toHaveURL(/\/dashboard\/protocols/, { timeout: 10000 });

  // check that our uploaded protocol is visible
  await expect(page.locator('text=SampleProtocol.netcanvas')).toHaveText('SampleProtocol.netcanvas');

  // validate screenshot
  await expect(page).toHaveScreenshot('protocols-page.png');
});

