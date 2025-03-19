import { expect, test } from '@playwright/test';

// general app navigation tests
test('should navigate to protocols page ', async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

  // click "protocols" in the top navigation
  await page.click('text=Protocols');
  await expect(page).toHaveURL(/\/dashboard\/protocols/, { timeout: 10000 });

});

test('should navigate to participants page ', async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  // click "participants" in the top navigation
  await page.click('text=Participants');
  await expect(page).toHaveURL(/\/dashboard\/participants/, { timeout: 10000 });
});