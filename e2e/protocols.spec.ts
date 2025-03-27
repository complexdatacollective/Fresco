/* eslint-disable no-console */
import { expect, test } from '@playwright/test';

let interviewURL: string;

test.describe('Protocols page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/protocols');
  });

  test('should display uploaded protocol', async ({ page }) => {
    // check that our uploaded protocol is visible
    await expect(page.locator('text=SampleProtocol.netcanvas')).toHaveText(
      'SampleProtocol.netcanvas',
    );
  });

  test('should match visual snapshot', async ({ page }) => {
    // validate screenshot
    await expect.soft(page).toHaveScreenshot('protocols-page.png');
  });

  test('should upload new protocol', async ({ page }) => {
    const protocolHandle = page.locator('input[type="file"]');
    await protocolHandle.setInputFiles('e2e/files/E2E.netcanvas');
    await expect(page.getByText('Extracting protocol')).toBeVisible();
    await expect(page.getByText('Complete...')).toBeVisible();
  });

  test('should delete protocol', async ({ page }) => {
    // find the table row with the protocol we want to delete
    await page
      .getByRole('row', { name: 'Select row Protocol icon E2E.' })
      .first()
      .getByLabel('Select row')
      .click();
    await page.getByRole('button', { name: 'Delete Selected' }).click();
    await page.getByRole('button', { name: 'Permanently Delete' }).click();

    // Verify the protocol is no longer in the table
    await expect(page.locator('text=E2E.netcanvas')).not.toBeVisible();
  });

  test('should copy anonymous participation url and navigate to it', async ({
    page,
    baseURL,
  }) => {
    await page.getByRole('button', { name: `${baseURL}/onboard` }).click();
    const copiedUrl = await page.evaluate(() => navigator.clipboard.readText());
    // eslint-disable-next-line no-console
    console.log('Copied URL:', copiedUrl);
    await page.goto(copiedUrl);
    await expect(page).toHaveURL(/\/interview/);
    // get the current url
    interviewURL = page.url();
    await expect(
      page.getByText('Welcome to the Sample Protocol'),
    ).toBeVisible();
  });
});

test.describe('Navigate through interview', () => {
  test.beforeEach(async ({ page }) => {
    // eslint-disable-next-line no-console
    console.log('interviewURL', interviewURL);
    await page.goto(interviewURL);
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('navigate through stages', async ({ page }) => {
    const viewport = page.viewportSize();
    console.log('Viewport dimensions:', viewport);
    const overlay = page.locator('[class*="lg:hidden"]');
    const isVisible = await overlay.isVisible();
    console.log('Overlay visibility:', isVisible);

    // Additional check
    const computedStyle = await overlay.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    console.log('Computed display style:', computedStyle);

    await page.getByRole('button').nth(4).click();
    await page.getByRole('button').nth(4).click();
    await page.getByRole('button').nth(4).click();
    await page.locator('#stage').getByRole('img').first().click();
    await page.getByText('Reset answer').click();
    await page.locator('#stage').getByRole('img').first().click();
    await page.getByRole('button').nth(4).click();
  });
});
