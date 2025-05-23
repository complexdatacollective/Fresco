import { expect, test } from '@playwright/test';

test.describe('Recent Activity table', () => {
  test('should display recent activities', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId('activity-ProtocolInstalled')).toHaveCount(2);

    await expect(
      page.getByTestId('activity-Participant(s)Added'),
    ).toBeVisible();
  });
});
