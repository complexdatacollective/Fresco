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
    await expect.soft(page).toHaveScreenshot('participants-page.png');
  });

  test('should add new participant', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Single Participant' }).click();
    await page.getByRole('button', { name: 'Generate' }).click();
    await page.getByRole('textbox', { name: 'Label' }).click();
    await page.getByRole('textbox', { name: 'Label' }).fill('New Participant');
    await page.getByRole('button', { name: 'Submit' }).click();
  });

  test.fixme('should edit participant', async ({ page }) => {
    test.setTimeout(30000);
    await page.getByRole('button', { name: 'Open menu' }).first().click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByRole('textbox', { name: 'Label' }).click();
    await page
      .getByRole('textbox', { name: 'Label' })
      .fill('New Participant Edit');
    await page.getByRole('button', { name: 'Update' }).click();
  });

  test.fixme('should copy unique URL', async ({ page }) => {
    test.setTimeout(30000);
    await page.getByRole('button', { name: 'Copy Unique URL' }).first().click();
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Sample Protocol' }).click();
    await page.getByText('Sample Protocol.netcanvas').click();
  });
});
