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

  test.fixme('should match visual snapshot', async ({ page }) => {
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

  test('should copy unique URL', async ({ page, baseURL }) => {
    await page.getByTestId('copy-url-button').first().click();
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'E2EProtocol.netcanvas' }).click();
    const copiedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiedUrl).toContain(`${baseURL}/onboard/`);
    await expect(page.getByTestId('toast-success')).toBeVisible();
  });

  test('export participation urls', async ({ page }) => {
    await page.getByTestId('generate-participant-urls').click();
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'E2EProtocol.netcanvas' }).click();
    await page.getByTestId('export-participation-urls-button').click();
    await expect(page.getByTestId('toast-success')).toBeVisible();
  });

  test('export participant list', async ({ page }) => {
    await page.getByTestId('export-participant-list').click();
    await expect(page.getByTestId('toast-success')).toBeVisible();
  });
});
