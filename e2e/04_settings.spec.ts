import { expect, test } from '@playwright/test';

test.describe('Settings page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/settings');
  });

  test('should check for switches', async ({ page }) => {
    const anonymousRecruitmentSwitch = page.getByRole('switch').first();
    const limitInterviewsSwitch = page.getByRole('switch').nth(1);
    const disableAnalyticsSwitch = page.getByRole('switch').nth(2);
    await expect(anonymousRecruitmentSwitch).toBeChecked();
    await expect(limitInterviewsSwitch).toBeChecked();
    await expect(disableAnalyticsSwitch).toBeChecked();
    await limitInterviewsSwitch.click();
    await expect(limitInterviewsSwitch).not.toBeChecked();
  });
});
