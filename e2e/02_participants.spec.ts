/* eslint-disable no-console */

import { expect, test } from '@playwright/test';
import { testWithStore } from './fixtures';

let baseInterviewURL: string;

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
    await page.waitForTimeout(2000); // let table load
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

  test('should copy unique URL and navigate to it', async ({
    page,
    baseURL,
  }) => {
    await page.getByTestId('copy-url-button').nth(1).click();
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'E2EProtocol.netcanvas' }).click();
    const copiedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiedUrl).toContain(`${baseURL}/onboard/`);
    await expect(page.getByTestId('toast-success')).toBeVisible();
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
    await expect.soft(page).toHaveScreenshot('information.png');
    await page.getByTestId('navigation-button').nth(1).click();
    await expect(page).toHaveURL(`${baseInterviewURL}?step=1`);
    await expect(page.getByTestId('ego-form-title')).toBeVisible();
    console.log('☑️ Information interface');
  });

  test('Ego form', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=1`);
    await expect(page.getByTestId('ego-form-title')).toBeVisible();
    await expect.soft(page).toHaveScreenshot('ego-form.png');
    await page.getByTestId('navigation-button').nth(1).click();

    // required fields
    await expect(page.getByTestId('form-field-text-error')).toHaveCount(2);
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

  testWithStore(
    'Name Generator - Quick Add',
    async ({ page, getSessionNodes }) => {
      await page.goto(`${baseInterviewURL}?step=2`);
      await expect(page.getByTestId('prompt')).toBeVisible();
      await page.getByTestId('action-button').click();
      await page.getByTestId('quick-node-form-input').fill('Alex');
      await page.getByTestId('quick-node-form-input').press('Enter');
      await page.getByTestId('quick-node-form-input').fill('Burt');
      await page.getByTestId('quick-node-form-input').press('Enter');
      await page.getByTestId('quick-node-form-input').fill('Carrie');
      await page.getByTestId('quick-node-form-input').press('Enter');

      await expect.soft(page).toHaveScreenshot('name-generator-quick-add.png');

      const nodes = await getSessionNodes(page);
      expect(nodes.length).toBe(3);

      await page.waitForTimeout(5000);
      console.log('☑️ Name Generator - Quick Add');
    },
  );

  testWithStore(
    'Name Generator - side panel',
    async ({ page, getSessionNodes }) => {
      await page.goto(`${baseInterviewURL}?step=3`);
      await expect(page.getByTestId('prompt')).toBeVisible();
      // d&d a node into the network
      const nodeB = page.getByTestId('node').nth(1);
      await nodeB.dragTo(page.getByTestId('node-list').nth(1));
      await expect(
        page.getByTestId('node-list').nth(1).getByText('Burt'),
      ).toBeVisible();
      const nodes = await getSessionNodes(page);
      expect(nodes[1]?.promptIDs).toEqual([
        'ef3a3de1-b986-472a-a074-1b42634680dd',
        'f98a377f-314a-4313-a4f3-fa7aa921333b',
      ]);

      await expect.soft(page).toHaveScreenshot('name-generator-side-panel.png');

      console.log('☑️ Name Generator - side panel');
    },
  );

  testWithStore('Name Generator - Form', async ({ page, getSessionNodes }) => {
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
    await page.waitForTimeout(2000);
    await expect.soft(page).toHaveScreenshot('name-generator-form.png');

    const nodes = await getSessionNodes(page);
    expect(nodes.length).toBe(4);
    console.log('☑️ Name Generator - Form');
  });

  testWithStore(
    'Name Generator - Roster',
    async ({ page, getSessionNodes }) => {
      await page.goto(`${baseInterviewURL}?step=5`);
      // check that roster people are there (Adelaide will be first)
      await expect(
        page.getByRole('heading', { name: 'Adelaide' }),
      ).toBeVisible();
      // sort first name ascending
      await page.getByTestId('filter-button').first().click();
      await expect(page.getByRole('heading', { name: 'Vonny' })).toBeVisible();
      // sort by last name descending
      await page.getByTestId('filter-button').nth(1).click();
      await expect(
        page.getByRole('heading', { name: 'Vasilis' }),
      ).toBeVisible();
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
      await expect.soft(page).toHaveScreenshot('name-generator-roster.png');

      const nodes = await getSessionNodes(page);
      expect(nodes.length).toBe(7);
      // hard wait
      await page.waitForTimeout(2000);
      console.log('☑️ Name Generator - Roster');
    },
  );

  test('Per alter form', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=6`);
    await expect(page.getByTestId('slidesform-intro')).toBeVisible();
    await page.getByTestId('navigation-button').nth(1).click();
    await expect(page.getByTestId('node')).toBeVisible();
    await expect(page.getByTestId('slidesform-progress')).toBeVisible();
    await expect(page.getByText('Delmor')).toBeVisible();
    await page.getByTestId('navigation-button').nth(1).click();
    await expect(page.getByText('Rebecka')).toBeVisible();
    await expect.soft(page).toHaveScreenshot('per-alter-form.png');
  });

  testWithStore('Sociogram', async ({ page, getSessionEdges }) => {
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

    await page.waitForTimeout(2000);

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

    await expect.soft(page).toHaveScreenshot('sociogram.png');

    const edges = await getSessionEdges(page);
    expect(edges.length).toBe(2);
    console.log('☑️ Sociogram');
  });

  testWithStore('dyad census', async ({ page, getSessionEdges }) => {
    await page.goto(`${baseInterviewURL}?step=9`);
    await expect(page.getByTestId('dyad-introduction-heading')).toBeVisible();
    await page.getByTestId('navigation-button').nth(1).click();
    await expect(page.getByTestId('prompt')).toBeVisible();
    await expect(page.getByText('Delmor')).toBeVisible();
    await expect(page.getByText('Rebecka')).toBeVisible();
    await page.getByTestId('dyad-yes').click();
    await expect(page.getByText('Butch')).toBeVisible();
    await page.getByTestId('dyad-no').click();
    await expect.soft(page).toHaveScreenshot('dyad-census.png');

    const edges = await getSessionEdges(page);
    expect(edges.length).toBe(3);
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
    await expect.soft(page).toHaveScreenshot('tie-strength-census.png');

    await page.getByTestId('boolean-option').nth(3).click();

    console.log('☑️ tie strength census');
  });

  testWithStore('per alter edge form', async ({ page, getSessionEdges }) => {
    await page.goto(`${baseInterviewURL}?step=11`);
    await expect(page.getByTestId('slidesform-intro')).toBeVisible();
    await page.getByTestId('navigation-button').nth(1).click();
    await expect(page.getByText('Alex')).toBeVisible();
    await expect(page.getByText('Burt')).toBeVisible();
    await page.getByTestId('form-field-radio-input').nth(1).click();
    await page.getByTestId('navigation-button').nth(1).click();
    await expect(page.getByText('Carrie')).toBeVisible();
    await page.getByTestId('form-field-radio-input').nth(0).click();
    await expect.soft(page).toHaveScreenshot('per-alter-edge-form.png');

    const edges = await getSessionEdges(page);
    expect(edges.length).toBe(5);
    console.log('☑️ per alter edge form');
  });

  test('sociogram - select', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=12`);
    await page.getByText('Alex', { exact: true }).click();
    await page.getByText('Burt', { exact: true }).click();

    // hard wait
    await page.waitForTimeout(2000);

    // check for two selected nodes
    await expect(page.locator('.node--selected')).toHaveCount(2);
    // next prompt
    await page.getByTestId('navigation-button').nth(1).click();
    // check for no selected nodes
    await expect(page.locator('.node--selected')).toHaveCount(0);

    await page.getByText('Carrie', { exact: true }).click();
    await expect(page.locator('.node--selected')).toHaveCount(1);
    await expect.soft(page).toHaveScreenshot('sociogram-select.png');

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
    await expect.soft(page).toHaveScreenshot('ordinal-bins.png');

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
    await expect.soft(page).toHaveScreenshot('categorical-bins.png');

    console.log('☑️ Categorical bins');
  });

  test('Skip logic/network filtering', async ({ page }) => {
    // this should show because we added 'Burt'
    // other nodes should not be visible
    await page.goto(`${baseInterviewURL}?step=15`);
    await expect(page.getByText('Burt')).toBeVisible();
    await expect(page.getByTestId('prompt')).toBeVisible();
    console.log('☑️ Skip logic/network filtering');
  });

  test('narrative', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=16`);

    await page.getByTestId('preset-switcher-label').click();

    // attributes, links, groups should be visible
    await expect(page.locator('.node--selected')).toHaveCount(2);
    await page.getByTestId('form-field-radio-input').nth(1).click();
    await expect(page.getByTestId('node').first()).toBeVisible();
    await expect(page.locator('.node--selected')).toHaveCount(1);
    await page.getByTestId('accordion').nth(0).click();

    await expect(page.locator('.node--selected')).toHaveCount(0);
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
    await expect.soft(page).toHaveScreenshot('narrative.png');

    console.log('☑️ Narrative');
  });

  test('Finish interview', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=17`);
    await page.getByTestId('finish-interview-button').click();
    await page.getByTestId('confirm-dialog-button').click();
    await expect(page.getByTestId('interview-completed')).toBeVisible();
    console.log('☑️ Finish interview');
  });
});
