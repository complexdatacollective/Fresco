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
      .fill('Alex');
    await page
      .getByRole('textbox', { name: 'Type a label and press enter' })
      .press('Enter');
    await page
      .getByRole('textbox', { name: 'Type a label and press enter' })
      .fill('Burt');
    await page
      .getByRole('textbox', { name: 'Type a label and press enter' })
      .press('Enter');
    await page
      .getByRole('textbox', { name: 'Type a label and press enter' })
      .fill('Carrie');
    await page
      .getByRole('textbox', { name: 'Type a label and press enter' })
      .press('Enter');
    await page.screenshot({ path: 'namegen.png' });
  });

  test('Name Generator - side panel', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=8`);

    await expect(page.getByText('Within the past 6 months')).toBeVisible();
    // check that nodes are in the side panel
    await expect(page.getByText('Carrie')).toBeVisible();

    // d&d A
    const nodeA = page.locator('.draggable').first(); // Alex
    await nodeA.dragTo(
      page.locator(
        '.name-generator-interface__nodes > .scrollable > .node-list',
      ),
    );
    await expect(
      page
        .locator('.name-generator-interface__nodes > .scrollable > .node-list')
        .getByText('Alex'),
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
    // check that roster people are there (Adelaide will be first)
    await expect(page.getByRole('heading', { name: 'Adelaide' })).toBeVisible();
    // sort first name ascending
    await page.getByRole('button', { name: 'FIRST NAME' }).click();
    await expect(page.getByRole('heading', { name: 'Vonny' })).toBeVisible();
    // sort by last name descending
    await page.getByRole('button', { name: 'LAST NAME' }).click();
    await expect(page.getByRole('heading', { name: 'Vasilis' })).toBeVisible();
    // sort by last name ascending
    await page.getByRole('button', { name: 'LAST NAME' }).click();
    await expect(page.getByRole('heading', { name: 'Leia' })).toBeVisible();
    // search for "Teador"
    await page
      .locator('input[placeholder="Enter a search term..."]')
      .fill('Teador');

    await expect(page.getByRole('heading', { name: 'Teador' })).toBeVisible();
    await page
      .locator('input[placeholder="Enter a search term..."]')
      .fill('Beech');
    await expect(page.getByRole('heading', { name: 'Delmor' })).toBeVisible();
    // search for "Beech" -> "Delmor Beech" should show up
    // d&d a couple nodes into network
    await page
      .getByRole('heading', { name: 'Delmor' })
      .dragTo(
        page.locator('.name-generator-roster-interface__node-list').first(),
      );
    await page
      .getByRole('heading', { name: 'Rebecka' })
      .dragTo(
        page.locator('.name-generator-roster-interface__node-list').first(),
      );
    await page
      .getByRole('heading', { name: 'Butch' })
      .dragTo(
        page.locator('.name-generator-roster-interface__node-list').first(),
      );
  });

  test('Sociogram', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=16`);
    await expect(page.getByText('Please position the people')).toBeVisible();
    await expect(page.getByText('Alex')).toBeVisible();
    // d&d Alex, Burt, Carrie into the sociogram
    const nodeA = page.getByText('Alex', { exact: true });
    await nodeA.dragTo(page.locator('.node-layout'));

    // verify that node A is visible in the new position
    await expect(nodeA).toBeVisible();

    await page.screenshot({ path: 'sociogram3.png' });

    const nodeB = page.getByText('Burt', { exact: true });
    await nodeB.hover();
    await page.mouse.down();
    await page.mouse.move(200, 100);
    await page.mouse.up();

    await expect(page.getByText('Carrie', { exact: true })).toBeVisible(); // Ensure Carrie is visible
    const nodeC = page.getByText('Carrie', { exact: true });
    await nodeC.hover();
    await page.mouse.down();
    await page.mouse.move(400, 400);
    await page.mouse.up();

    // Verify that nodes are visible in their new positions
    await expect(page.locator('.node-layout').getByText('Alex')).toBeVisible();
    await expect(page.locator('.node-layout').getByText('Burt')).toBeVisible();
    await expect(
      page.locator('.node-layout').getByText('Carrie'),
    ).toBeVisible();

    // Proceed to the next step
    await page.goto(`${baseInterviewURL}?step=19`);
    await expect(page.getByText('Please connect any')).toBeVisible();

    // Connect A & B
    await nodeA.click();
    await nodeB.click();

    // Connect A & C
    await nodeA.click();
    await nodeC.click();

    // Remove connection between A & B
    await nodeA.click();
    await nodeB.click();

    // TODO: Verify connections visually or programmatically if possible
  });

  test('dyad census', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=20`);
    await expect(
      page.getByRole('heading', { name: 'Dyad Census' }),
    ).toBeVisible();
    await page.getByRole('button').nth(4).click();
    await expect(page.getByText('To the best of your knowledge')).toBeVisible();
    await expect(page.getByText('Delmor')).toBeVisible();
    await expect(page.getByText('Rebecka')).toBeVisible();
    await page.getByText('Yes').click();
    await expect(page.getByText('Butch')).toBeVisible();
  });

  test('ordinal bins', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=24`);
    await expect(page.getByText('When was the last time')).toBeVisible();
    await page
      .locator('div.draggable')
      .first()
      .dragTo(page.locator('.ordinal-bin--content').first());
    await page
      .locator('div.draggable')
      .first()
      .dragTo(page.locator('.ordinal-bin--content').nth(2));
  });

  test('categorical bins', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=25`);
    await expect(page.getByText('Which of these options')).toBeVisible();
    await page
      .locator('div.draggable')
      .first()
      .dragTo(page.locator('.categorical-list__item').first());
    await page
      .locator('div.draggable')
      .first()
      .dragTo(page.locator('.categorical-list__item').nth(4));
    await expect(
      page.getByText('Which context best describes how you know this person'),
    ).toBeVisible();
    await page
      .locator('input[placeholder="Enter your response here..."]')
      .fill('Roommate');
    await page.click('button[type="submit"]');
  });
  test('narrative', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=29`);
    await page.getByText('Sample Preset').click();
    // attributes, links, groups should be visible
    await expect(page.getByText('provides_advice')).toBeVisible();
    await expect(page.getByText('know')).toBeVisible();
    await expect(page.getByText('Family Member')).toBeVisible();

    // todo: select attributes, links, groups and verify that they are applied.
  });
});
