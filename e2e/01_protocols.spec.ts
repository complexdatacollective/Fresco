/* eslint-disable no-console */
import { expect, test } from '@playwright/test';
import { testWithStore } from './fixtures';

let baseInterviewURL: string;

test.describe('Protocols page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/protocols');
  });

  test('should display uploaded protocol', async ({ page }) => {
    // check that our uploaded protocol is visible
    await expect(page.locator('text=E2EProtocol.netcanvas')).toHaveText(
      'E2EProtocol.netcanvas',
    );
  });

  test('should match visual snapshot', async ({ page }) => {
    // validate screenshot
    await expect.soft(page).toHaveScreenshot('protocols-page.png');
  });

  test.fixme('should upload new protocol', async ({ page }) => {
    const protocolHandle = page.locator('input[type="file"]');
    await protocolHandle.setInputFiles('e2e/files/SmallProtocol.netcanvas');
    await expect(
      page.getByTestId('job-card-Extracting protocol'),
    ).toBeVisible();
    await expect(page.getByTestId('job-card-Complete')).toBeVisible();
  });

  test.fixme('should delete protocol', async ({ page }) => {
    // find the table row with the protocol we want to delete
    await page.getByTestId('actions-dropdown-protocols').first().click();
    await page.getByRole('menuitem').nth(1).click();
    await page.getByTestId('confirm-delete-protocols-button').click();

    // Verify the protocol is no longer in the table
    await expect(page.getByText('SmallProtocol.netcanvas')).not.toBeVisible();
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
    await expect(page.getByTestId('information-interface-title')).toBeVisible();
  });
});

test.describe('Complete E2E Test Protocol interview', () => {
  test('Information interfaces and nav buttons', async ({ page }) => {
    console.log('Beginning Sample Protocol interview:', baseInterviewURL);

    await page.goto(`${baseInterviewURL}?step=0`);
    await expect(page.getByTestId('information-interface-title')).toBeVisible();
    await page.getByTestId('navigation-button').nth(1).click();
    await expect(page).toHaveURL(`${baseInterviewURL}?step=1`);
    await expect(page.getByTestId('ego-form-title')).toBeVisible();
    console.log('☑️ Information interface');
  });

  test('Ego form', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=1`);
    await expect(page.getByTestId('ego-form-title')).toBeVisible();
    await page.getByTestId('navigation-button').nth(1).click();
    // required fields
    expect(await page.getByTestId('form-field-text-error').count()).toBe(2);
    await page.getByTestId('form-field-text-input').first().fill('John');
    await page.getByTestId('form-field-text-input').nth(1).fill('Doe');
    await page.getByTestId('date-picker-preview').click();
    await page.getByTestId('date-picker-range-item-1995').click();
    await page.getByTestId('date-picker-range-item-4').first().click();
    await page.getByTestId('date-picker-range-item-21').click();
    await page.getByTestId('form-field-radio-input').nth(2).click();
    await page.getByTestId('form-field-checkbox-input').nth(1).click();
    await page.getByTestId('form-field-checkbox-input').nth(3).click();
    await page
      .getByTestId('form-field-text-area-input')
      .fill('Additional Info');
    console.log('☑️ Ego form');
  });

  test('Name Generator - Quick Add', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=2`);
    await expect(page.getByTestId('prompt')).toBeVisible();
    await page.getByTestId('action-button').click();
    await page.getByTestId('quick-node-form-input').fill('Alex');
    await page.getByTestId('quick-node-form-input').press('Enter');
    await page.getByTestId('quick-node-form-input').fill('Burt');
    await page.getByTestId('quick-node-form-input').press('Enter');
    await page.getByTestId('quick-node-form-input').fill('Carrie');
    await page.getByTestId('quick-node-form-input').press('Enter');
    console.log('☑️ Name Generator - Quick Add');
  });

  test('Name Generator - side panel', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=3`);
    await expect(page.getByTestId('prompt')).toBeVisible();
    // d&d a node into the network
    const nodeB = page.getByTestId('node').nth(1);
    await nodeB.dragTo(page.getByTestId('node-list').nth(1));
    await expect(
      page.getByTestId('node-list').nth(1).getByText('Burt'),
    ).toBeVisible();
    console.log('☑️ Name Generator - side panel');
  });

  test('Name Generator - Form', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=4`);
    await expect(page.getByTestId('prompt')).toBeVisible();
    await page.getByTestId('action-button').click();
    await page
      .getByTestId('form-field-text-input')
      .first()
      .fill('Local Hospital');
    await page.getByTestId('node-form-submit').click();
    // select again to open editing
    await page.getByTestId('node').click();
    await page.getByTestId('close-button').click();
    console.log('☑️ Name Generator - Form');
  });

  test('Name Generator - Roster', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=5`);
    // check that roster people are there (Adelaide will be first)
    await expect(page.getByRole('heading', { name: 'Adelaide' })).toBeVisible();
    // sort first name ascending
    await page.getByTestId('filter-button').first().click();
    await expect(page.getByRole('heading', { name: 'Vonny' })).toBeVisible();
    // sort by last name descending
    await page.getByTestId('filter-button').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Vasilis' })).toBeVisible();
    // sort by last name ascending
    await page.getByTestId('filter-button').nth(1).click();
    await expect(page.getByRole('heading', { name: 'Leia' })).toBeVisible();
    // search for "Teador"
    await page.getByTestId('form-field-text-input').fill('Teador');

    await expect(page.getByRole('heading', { name: 'Teador' })).toBeVisible();
    // search for "Beech" -> "Delmor Beech" should show up
    await page.getByTestId('form-field-text-input').fill('Beech');
    await expect(page.getByRole('heading', { name: 'Delmor' })).toBeVisible();
    // d&d a couple nodes into network
    await page
      .getByRole('heading', { name: 'Delmor' })
      .dragTo(page.getByTestId('name-generator-roster-node-list'));
    await page
      .getByRole('heading', { name: 'Rebecka' })
      .dragTo(page.getByTestId('name-generator-roster-node-list'));
    await page
      .getByRole('heading', { name: 'Butch' })
      .dragTo(page.getByTestId('name-generator-roster-node-list'));
    console.log('☑️ Name Generator - Roster');
  });

  test('Per alter form', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=6`);
    await expect(page.getByTestId('slidesform-intro')).toBeVisible();
    await page.getByTestId('navigation-button').nth(1).click();
    await expect(page.getByTestId('node')).toBeVisible();
    await expect(page.getByTestId('slidesform-progress')).toBeVisible();
    await expect(page.getByText('1')).toBeVisible();
    await page.getByTestId('navigation-button').nth(1).click();
    await expect(page.getByText('2')).toBeVisible();
  });

  testWithStore('Sociogram', async ({ page, context, getSessionEdges }) => {
    // todo: put this in the fixture
    await context.addInitScript('window.IS_PLAYWRIGHT = true;');

    await page.goto(`${baseInterviewURL}?step=7`);

    await expect(page.getByTestId('node')).toBeVisible();
    // d&d Alex, Burt, Carrie into the sociogram
    const nodeA = page.getByText('Alex', { exact: true });
    await nodeA.dragTo(page.getByTestId('node-layout'));
    // verify that node A is visible in the new position
    await expect(nodeA).toBeVisible();

    const nodeB = page.getByText('Burt', { exact: true });
    await nodeB.hover();
    await page.mouse.down();
    await page.mouse.move(200, 100);
    await page.mouse.up();

    const nodeC = page.getByText('Carrie', { exact: true });
    await nodeC.hover();
    await page.mouse.down();
    await page.mouse.move(400, 400);
    await page.mouse.up();

    // Verify that nodes are visible in their new positions
    await expect(
      page.getByTestId('node-layout').getByText('Alex'),
    ).toBeVisible();
    await expect(
      page.getByTestId('node-layout').getByText('Burt'),
    ).toBeVisible();
    await expect(
      page.getByTestId('node-layout').getByText('Carrie'),
    ).toBeVisible();

    // Proceed to the next step
    await page.getByTestId('navigation-button').nth(1).click();

    // Connect A & B
    await nodeA.click();
    await nodeB.click();

    // Connect A & C
    await nodeA.click();
    await nodeC.click();

    // Remove connection between A & B
    await nodeA.click();
    await nodeB.click();

    // there should be only one line. if this is the case, this will pass.
    await expect(
      page.locator('line[stroke="var(--nc-edge-color-seq-1)"]'),
    ).toBeVisible();

    // go to next prompt
    await page.getByTestId('navigation-button').nth(1).click();
    await nodeA.click();
    await nodeB.click();
    // different color line
    await expect(
      page.locator('line[stroke="var(--nc-edge-color-seq-6)"]'),
    ).toBeVisible();

    // hard wait so that the redux store is updated before proceeding
    await page.waitForTimeout(2000);

    const edges = await getSessionEdges(page);
    expect(edges.length).toBe(2);
    console.log('☑️ Sociogram');
  });

  test('dyad census', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=9`);
    await expect(page.getByTestId('dyad-introduction-heading')).toBeVisible();
    await page.getByTestId('navigation-button').nth(1).click();
    await expect(page.getByTestId('prompt')).toBeVisible();
    await expect(page.getByText('Delmor')).toBeVisible();
    await expect(page.getByText('Rebecka')).toBeVisible();
    await page.getByTestId('dyad-yes').click();
    await expect(page.getByText('Butch')).toBeVisible();
    await page.getByTestId('dyad-no').click();
    console.log('☑️ Dyad census');
  });

  test('tie strength census', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=10`);
    await expect(page.getByTestId('tiestrength-intro')).toBeVisible();
    await page.getByTestId('navigation-button').nth(1).click();
    await expect(page.getByTestId('prompt')).toBeVisible();
    await expect(page.getByText('Alex')).toBeVisible();
    await expect(page.getByText('Burt')).toBeVisible();
    await page.getByTestId('boolean-option').nth(1).click();
    await expect(page.getByText('Carrie')).toBeVisible();
    await page.getByTestId('boolean-option').nth(3).click();
    console.log('☑️ tie strength census');
  });

  test('per alter edge form', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=11`);
    await expect(page.getByTestId('slidesform-intro')).toBeVisible();
    await page.getByTestId('navigation-button').nth(1).click();
    await expect(page.getByText('Alex')).toBeVisible();
    await expect(page.getByText('Burt')).toBeVisible();
    await page.getByTestId('form-field-radio-input').nth(1).click();
    await page.getByTestId('navigation-button').nth(1).click();
    await expect(page.getByText('Carrie')).toBeVisible();
    await page.getByTestId('form-field-radio-input').nth(0).click();
    console.log('☑️ tie strength census');
  });

  test('sociogram - select', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=12`);
    await page.getByText('Alex', { exact: true }).click();
    await page.getByText('Burt', { exact: true }).click();

    // check for two selected nodes
    expect(await page.locator('.node--selected').count()).toBe(2);
    // next prompt
    await page.getByTestId('navigation-button').nth(1).click();
    // check for no selected nodes
    expect(await page.locator('.node--selected').count()).toBe(0);

    await page.getByText('Carrie', { exact: true }).click();
    expect(await page.locator('.node--selected').count()).toBe(1);
    console.log('☑️ Sociogram - select');
  });

  test('ordinal bins', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=13`);
    await expect(page.getByTestId('prompt')).toBeVisible();
    await page.getByTestId('node').dragTo(page.getByTestId('ordinal-bin-0'));
    await page
      .getByTestId('node')
      .first()
      .dragTo(page.getByTestId('ordinal-bin-2'));
    console.log('☑️ Ordinal bins');
  });

  test('categorical bins', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=14`);
    await expect(page.getByTestId('prompt')).toBeVisible();
    await page
      .getByTestId('node')
      .dragTo(page.getByTestId('categorical-list-item-0'));
    await page
      .getByTestId('node')
      .first()
      .dragTo(page.getByTestId('categorical-list-item-4'));
    await expect(
      page.getByText('Which context best describes how you know this person'),
    ).toBeVisible();
    await page.getByTestId('form-field-text-input').fill('Roommate');
    await page.click('button[type="submit"]');
    // put third node in first bin (family)
    await page
      .getByTestId('node')
      .first()
      .dragTo(page.getByTestId('categorical-list-item-0'));
    console.log('☑️ Categorical bins');
  });

  // todo: skip logic/network filtering (15)
  test('Skip logic/network filtering', async ({ page }) => {
    // this should show because we added 'Burt'
    // other nodes should not be visible
    await page.goto(`${baseInterviewURL}?step=15`);
    await expect(page.getByText('Burt')).toBeVisible();
    await expect(page.getByTestId('prompt')).toBeVisible();
  });

  test('narrative', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=16`);

    await page.getByTestId('preset-switcher-label').click();

    // attributes, links, groups should be visible
    expect(await page.locator('.node--selected').count()).toBe(2);
    await page.getByTestId('form-field-radio-input').nth(1).click();
    expect(await page.locator('.node--selected').count()).toBe(1);
    await page.getByTestId('accordion').nth(0).click();

    expect(await page.locator('.node--selected').count()).toBe(0);
    await expect(page.getByTestId('edge-label-0')).toBeVisible();
    await expect(
      page.locator('line[stroke="var(--nc-edge-color-seq-1)"]'),
    ).toBeVisible();
    await expect(
      page.locator('line[stroke="var(--nc-edge-color-seq-6)"]'),
    ).toBeVisible();
    await page.getByTestId('accordion').nth(1).click();
    // the lines should not be visible
    await expect(
      page.locator('line[stroke="var(--nc-edge-color-seq-1)"]'),
    ).not.toBeVisible();
    await expect(page.getByTestId('group-label-0')).toBeVisible();
    await expect(
      page.locator('.convex-hull.convex-hull__cat-color-seq-1'),
    ).toBeVisible();
    await page.getByTestId('accordion').nth(2).click();
    await expect(
      page.locator('.convex-hull.convex-hull__cat-color-seq-1'),
    ).not.toBeVisible();

    // draw on the canvas
    await page.mouse.move(200, 200);
    await page.mouse.down();
    await page.mouse.move(200, 300);
    await page.mouse.move(300, 300);
    await page.mouse.move(300, 200);
    await page.mouse.up();
    // check for the line
    await expect(page.getByTestId('annotation-path')).toBeVisible();
    // reset
    await page.getByTestId('reset-narrative-button').click();
    await expect(page.getByTestId('annotation-path')).not.toBeVisible();
    console.log('☑️ Narrative');
  });
});
