import { expect, test } from '@playwright/test';

test.describe('Participants page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/participants');
  });

  test('should display imported participants', async ({ page }) => {
    // check that our imported participants are visible
    await expect(page.getByText('Christopher Lee')).toBeVisible();
    await expect(page.getByText('Emily Brown')).toBeVisible();
  });

  test('should match visual snapshot', async ({ page }) => {
    // validate screenshot
    await expect.soft(page).toHaveScreenshot('participants-page.png');
  });

  test('should add new participant', async ({ page }) => {
    await page.getByTestId('add-participant-button').click();
    await page.getByTestId('generate-participant-id-button').click();
    await page.getByRole('textbox').nth(1).fill('New Participant');
    await page.getByTestId('submit-participant').click();
  });

  test('should edit participant', async ({ page }) => {
    await page.getByTestId('actions-dropdown-participants').first().click();
    await page.getByRole('menuitem').nth(0).click();
    await page.getByRole('textbox').nth(1).fill('New Participant Edited');
    await page.getByTestId('submit-participant').click();
  });

  test.fixme('should copy unique URL', async ({ page }) => {
    await page.getByTestId('copy-url-button').click();
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Sample Protocol' }).click();
    await page.getByText('Sample Protocol.netcanvas').click();

    // console.log url that was copied to clipboard
    const copiedUrl = await page.evaluate(() => navigator.clipboard.readText());
    // eslint-disable-next-line no-console
    console.log('Copied URL:', copiedUrl);
  });
});
