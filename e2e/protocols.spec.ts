/* eslint-disable no-console */
import { expect, test } from '@playwright/test';

let baseInterviewURL: string;

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
    // Get the current URL and remove the step parameter
    const currentUrl = page.url();
    baseInterviewURL = currentUrl.split('?')[0] ?? '';
    console.log('Base Interview URL:', baseInterviewURL);
    await expect(
      page.getByText('Welcome to the Sample Protocol'),
    ).toBeVisible();
  });
});

test.describe('Complete Sample Protocol interview', () => {
  test('Information interfaces and nav buttons', async ({ page }) => {
    console.log('Using interview URL:', baseInterviewURL);
    await page.goto(`${baseInterviewURL}?step=0`);
    await expect(
      page.getByText('Welcome to the Sample Protocol'),
    ).toBeVisible();
    await page.getByRole('button').nth(4).click();
    await expect(
      page.getByRole('heading', { name: 'Information Interface' }),
    ).toBeVisible();
  });

  test('Ego form - consent', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=3`);
    await expect(
      page.getByRole('heading', { name: 'Sample Consent Form' }),
    ).toBeVisible();
    await page.locator('.boolean-option').first().click();
    await page.getByText('Reset answer').click();
    await page.locator('.boolean-option').first().click();
  });

  test('Ego form', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=4`);
    await expect(
      page.getByRole('heading', {
        name: 'Conventional Ego Data Collection Example',
      }),
    ).toBeVisible();
    await page
      .locator('div')
      .filter({ hasText: /^What is your first name\?$/ })
      .first()
      .click();
    await page
      .locator('input[name="\\34 ab18994-a252-47cb-ba19-20b6ffc0e927"]')
      .fill('John');
    await page
      .locator('div')
      .filter({ hasText: /^What is your last name\?$/ })
      .first()
      .click();
    await page
      .locator('input[name="\\33 b5197a9-d024-421c-8663-1e06e0587999"]')
      .fill('Doe');
    await page.locator('label').filter({ hasText: 'Very Satisfied' }).click();
    await page.getByText('Somewhat Satisfied').nth(1).click();
    await page
      .locator('label')
      .filter({ hasText: 'Post' })
      .locator('div')
      .first()
      .click();
    await page
      .locator('label')
      .filter({ hasText: 'SMS' })
      .locator('div')
      .first()
      .click();
    await page.getByRole('textbox', { name: 'Is there any other' }).click();
    await page
      .getByRole('textbox', { name: 'Is there any other' })
      .fill('Additional Information');
  });

  test('Name Generator - Quick Add', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=6`);
    await expect(page.getByText('Within the past 6 months')).toBeVisible();
    await page.getByRole('button', { name: 'Menu - New Session' }).click();
    await page
      .getByRole('textbox', { name: 'Type a label and press enter' })
      .fill('A');
    await page
      .getByRole('textbox', { name: 'Type a label and press enter' })
      .press('Enter');
    await page
      .getByRole('textbox', { name: 'Type a label and press enter' })
      .fill('B');
    await page
      .getByRole('textbox', { name: 'Type a label and press enter' })
      .press('Enter');
    await page
      .getByRole('textbox', { name: 'Type a label and press enter' })
      .fill('C');
    await page
      .getByRole('textbox', { name: 'Type a label and press enter' })
      .press('Enter');
  });

  test('Name Generator - side panel', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=8`);

    await expect(page.getByText('Within the past 6 months')).toBeVisible();
    // check that nodes are in the side panel
    await expect(page.getByText('ABC')).toBeVisible();

    // d&d A
    const nodeA = page.locator('div').filter({ hasText: /^A$/ }).nth(3);
    await nodeA.dragTo(
      page.locator(
        '.name-generator-interface__nodes > .scrollable > .node-list',
      ),
    );
    await expect(
      page
        .locator('.name-generator-interface__nodes > .scrollable > .node-list')
        .getByText('A'),
    ).toBeVisible();
  });

  test('Name Generator - Form', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=10`);
    await expect(page.getByText('Within the past 12 months')).toBeVisible();
    await page.getByRole('button', { name: 'Menu - New Session' }).click();
    await expect(
      page.getByRole('heading', {
        name: 'Add a Clinic or Health Care Provider',
      }),
    ).toBeVisible();
    await page
      .getByRole('textbox', { name: 'Enter some text...' })
      .fill('My Hospital');
    await page
      .getByRole('button', { name: 'Year / Month / Day clear' })
      .click();
    // todo: pick date
    await page.getByRole('button', { name: 'Submit' }).click();
    // select again to open editing
    await page.getByText('My Hospital').click();
    await page.getByRole('img', { name: 'Close' }).click(); // close the dialog
  });

  test('Name Generator - Roster', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=12`);
    await expect(page.getByText('Please select any members')).toBeVisible();
    // todo: loading external data...
    // check that roster people are there (Adelaide)
    // sort first name ascending
    //check that "Vonny" is the first name in the list
    // sort by last name descending
    // check "vasilis" is the first name in the list
    // sort by last name ascending
    // leia is first
    // search for "Teador"
    // search for "Beech" -> "Delmor Beech" should show up
    // d&d Delmor into network
  });
  test('Sociogram', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=16`);
    await expect(page.getByText('Please position the people')).toBeVisible();
    // d&d A, B, C into the sociogram
    // use manual dragging so they're not just stacked...
    const nodeA = page.getByText('A', { exact: true });
    await nodeA.hover();
    await page.mouse.down();
    await page.mouse.move(-200, -200);
    await page.mouse.up();
    const nodeB = page.getByText('B', { exact: true });
    await nodeB.hover();
    await page.mouse.down();
    await page.mouse.move(0, -400);
    await page.mouse.up();
    const nodeC = page.getByText('C', { exact: true });
    await nodeC.hover();
    await page.mouse.down();
    await page.mouse.move(200, -200); // move to the right and up
    await page.mouse.up();

    await expect(page.locator('.node-layout').getByText('A')).toBeVisible();
    await expect(page.locator('.node-layout').getByText('B')).toBeVisible();
    await expect(page.locator('.node-layout').getByText('C')).toBeVisible();
    await page.goto(`${baseInterviewURL}?step=19`);
    await expect(page.getByText('Please connect any')).toBeVisible();
    // connect A & B
    await nodeA.click();
    await nodeB.click();
    // connect A & C
    await nodeA.click();
    await nodeB.click();
    // remove connection
    await nodeA.click();
    await nodeB.click();
    // todo: verify connections
  });
});
