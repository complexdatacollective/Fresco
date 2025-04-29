import { expect, test } from '@playwright/test';

// general app navigation tests
test('should navigate to protocols page ', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByTestId('nav-protocols').click();
  await expect(page).toHaveURL(/\/dashboard\/protocols/);
});

test('should navigate to participants page ', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByTestId('nav-participants').click();
  await expect(page).toHaveURL(/\/dashboard\/participants/);
});

test('should navigate to interviews page ', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByTestId('nav-interviews').click();
  await expect(page).toHaveURL(/\/dashboard\/interviews/);
});

test('should navigate to settings page ', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByTestId('nav-settings').click();
  await expect(page).toHaveURL(/\/dashboard\/settings/);
});

test('should open feedback form', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByTestId('feedback-button').click();
  await expect(page.getByTestId('feedback-form')).toBeVisible();
});
