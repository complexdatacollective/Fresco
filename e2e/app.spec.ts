import { expect } from '@playwright/test';
import { test } from './fixtures/signIn';

test('should navigate to protocols page ', async ({ page }) => {
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

test('should navigate to participants page ', async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  // click "participants" in the top navigation
  await page.click('text=Participants');
  await expect(page).toHaveURL(/\/dashboard\/participants/, { timeout: 10000 });

  // check that our imported participants are visible
  await expect(page.locator('text=Christopher Lee')).toHaveText('Christopher Lee');
  await expect(page.locator('text=Emily Brown')).toHaveText('Emily Brown');

  // validate screenshot
  await expect(page).toHaveScreenshot('participants-page.png');
});