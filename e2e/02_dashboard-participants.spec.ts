/* eslint-disable no-console */

import { expect, test } from '@playwright/test';
import { testWithStore } from './fixtures/store.fixture';

let baseInterviewURL: string;

test.describe('Participants page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/participants');
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should display imported participants', async ({ page }) => {
    // Use Playwright's auto-waiting assertions
    await expect(page.getByText('Christopher Lee')).toBeVisible();
    await expect(page.getByText('Emily Brown')).toBeVisible();
  });

  test('should match visual snapshot', async ({ page }) => {
    // Wait for table data to load by checking for specific content
    await expect(page.getByText('Christopher Lee')).toBeVisible();
    await expect(page.getByText('Emily Brown')).toBeVisible();

    // Ensure any animations are complete
    await page.waitForLoadState('networkidle');

    await expect.soft(page).toHaveScreenshot('participants-page.png');
  });

  test('should add new participant', async ({ page }) => {
    await page.getByTestId('add-participant-button').click();

    // Wait for the modal/form to appear
    await page
      .getByTestId('generate-participant-id-button')
      .waitFor({ state: 'visible' });
    await page.getByTestId('generate-participant-id-button').click();

    // Wait for ID generation to complete (assuming it populates a field)
    await page.waitForFunction(() => {
      const idField = document.querySelector(
        '[data-testid="participant-id-field"]',
      );
      return idField && idField.value !== '';
    });

    await page.getByRole('textbox').nth(1).fill('New Participant');
    await page.getByTestId('submit-participant').click();

    // Wait for success indication
    await expect(page.getByText('New Participant')).toBeVisible();
  });

  test('should edit participant', async ({ page }) => {
    await page.getByTestId('actions-dropdown-participants').first().click();

    // Wait for dropdown menu to be visible
    await page.getByRole('menuitem').nth(0).waitFor({ state: 'visible' });
    await page.getByRole('menuitem').nth(0).click();

    // Wait for edit form to appear
    await page.getByRole('textbox').nth(1).waitFor({ state: 'visible' });
    await page.getByRole('textbox').nth(1).fill('New Participant Edited');
    await page.getByTestId('submit-participant').click();

    // Verify the edit was successful
    await expect(page.getByText('New Participant Edited')).toBeVisible();
  });

  test('export participation urls', async ({ page }) => {
    await page.getByTestId('generate-participant-urls').click();

    // Wait for modal to appear
    await page.getByRole('combobox').first().waitFor({ state: 'visible' });
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'E2EProtocol.netcanvas' }).click();
    await page.getByTestId('export-participation-urls-button').click();

    // Wait for success toast
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

    // Wait for modal/dropdown to appear
    await page.getByRole('combobox').waitFor({ state: 'visible' });
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'E2EProtocol.netcanvas' }).click();

    // Wait for clipboard operation
    await expect(page.getByTestId('toast-success')).toBeVisible();

    const copiedUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiedUrl).toContain(`${baseURL}/onboard/`);

    await page.goto(copiedUrl);
    await expect(page).toHaveURL(/\/interview/);

    // Get the current URL and remove the step parameter
    const currentUrl = page.url();
    baseInterviewURL = currentUrl.split('?')[0] ?? '';

    // Wait for interview to load
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
    async ({ page, getSessionNodes, waitForNodeCount }) => {
      await page.goto(`${baseInterviewURL}?step=2`);
      await expect(page.getByTestId('prompt')).toBeVisible();
      await page.getByTestId('action-button').click();

      // Add nodes and wait for each to be added to the DOM
      await page.getByTestId('quick-node-form-input').fill('Alex');
      await page.getByTestId('quick-node-form-input').press('Enter');
      await expect(page.getByText('Alex')).toBeVisible();

      await page.getByTestId('quick-node-form-input').fill('Burt');
      await page.getByTestId('quick-node-form-input').press('Enter');
      await expect(page.getByText('Burt')).toBeVisible();

      await page.getByTestId('quick-node-form-input').fill('Carrie');
      await page.getByTestId('quick-node-form-input').press('Enter');
      await expect(page.getByText('Carrie')).toBeVisible();

      await waitForNodeCount(page, 3);

      await expect.soft(page).toHaveScreenshot('name-generator-quick-add.png');

      const nodes = await getSessionNodes(page);
      expect(nodes.length).toBe(3);

      console.log('☑️ Name Generator - Quick Add');
    },
  );

  testWithStore(
    'Name Generator - side panel',
    async ({ page, getSessionNodes, waitForNodeCount }) => {
      await page.goto(`${baseInterviewURL}?step=3`);
      await expect(page.getByTestId('prompt')).toBeVisible();

      // Ensure elements are ready for drag and drop
      const nodeB = page.getByTestId('node').nth(1);
      const targetList = page.getByTestId('node-list').nth(1);

      await nodeB.waitFor({ state: 'visible' });
      await targetList.waitFor({ state: 'visible' });

      // Perform drag and drop
      await nodeB.dragTo(targetList);

      // Wait for the node to appear in the new location
      await expect(targetList.getByText('Burt')).toBeVisible();

      // Wait for Redux state to update
      await waitForNodeCount(page, 2);

      const nodes = await getSessionNodes(page);
      expect(nodes[1]?.promptIDs).toEqual([
        'ef3a3de1-b986-472a-a074-1b42634680dd',
        'f98a377f-314a-4313-a4f3-fa7aa921333b',
      ]);

      await expect.soft(page).toHaveScreenshot('name-generator-side-panel.png');

      console.log('☑️ Name Generator - side panel');
    },
  );

  testWithStore(
    'Name Generator - Form',
    async ({ page, getSessionNodes, waitForNodeCount }) => {
      await page.goto(`${baseInterviewURL}?step=4`);
      await expect(page.getByTestId('prompt')).toBeVisible();
      await page.getByTestId('action-button').click();

      // Wait for form to appear
      await page
        .getByTestId('form-field-text-input')
        .first()
        .waitFor({ state: 'visible' });
      await page
        .getByTestId('form-field-text-input')
        .first()
        .fill('Local Hospital');
      await page.getByTestId('node-form-submit').click();

      // Wait for node to be created
      await expect(page.getByText('Local Hospital')).toBeVisible();

      // Select again to open editing
      await page.getByTestId('node').click();

      // Wait for edit modal to appear
      await page.getByTestId('close-button').waitFor({ state: 'visible' });
      await page.getByTestId('close-button').click();

      // Wait for modal to close
      await page.waitForLoadState('networkidle');

      await expect.soft(page).toHaveScreenshot('name-generator-form.png');

      await waitForNodeCount(page, 4);

      const nodes = await getSessionNodes(page);
      expect(nodes.length).toBe(4);
      console.log('☑️ Name Generator - Form');
    },
  );

  testWithStore(
    'Name Generator - Roster',
    async ({ page, getSessionNodes, waitForNodeCount }) => {
      await page.goto(`${baseInterviewURL}?step=5`);

      // Wait for roster to load
      await expect(
        page.getByRole('heading', { name: 'Adelaide' }),
      ).toBeVisible();

      // Sort first name ascending
      await page.getByTestId('filter-button').first().click();
      await expect(page.getByRole('heading', { name: 'Vonny' })).toBeVisible();

      // Sort by last name descending
      await page.getByTestId('filter-button').nth(1).click();
      await expect(
        page.getByRole('heading', { name: 'Vasilis' }),
      ).toBeVisible();

      // Sort by last name ascending
      await page.getByTestId('filter-button').nth(1).click();
      await expect(page.getByRole('heading', { name: 'Leia' })).toBeVisible();

      // Search for "Teador"
      await page.getByTestId('form-field-text-input').fill('Teador');
      await expect(page.getByRole('heading', { name: 'Teador' })).toBeVisible();

      // Search for "Beech" -> "Delmor Beech" should show up
      await page.getByTestId('form-field-text-input').fill('Beech');
      await expect(page.getByRole('heading', { name: 'Delmor' })).toBeVisible();

      // Drag and drop nodes into network
      const targetArea = page.getByTestId('name-generator-roster-node-list');
      await targetArea.waitFor({ state: 'visible' });

      // Drag Delmor
      const delmor = page.getByRole('heading', { name: 'Delmor' });
      await delmor.waitFor({ state: 'visible' });
      await delmor.dragTo(targetArea);
      await expect(targetArea.locator('text=Delmor')).toBeVisible();

      // Drag Rebecka
      await page.getByRole('heading', { name: 'Rebecka' }).dragTo(targetArea);
      await expect(targetArea.locator('text=Rebecka')).toBeVisible();

      // Drag Butch
      await page.getByRole('heading', { name: 'Butch' }).dragTo(targetArea);
      await expect(targetArea.locator('text=Butch')).toBeVisible();

      // Wait for Redux state to settle
      await waitForNodeCount(page, 7);

      await expect.soft(page).toHaveScreenshot('name-generator-roster.png');

      const nodes = await getSessionNodes(page);
      expect(nodes.length).toBe(7);

      console.log('☑️ Name Generator - Roster');
    },
  );

  test('Per alter form', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=6`);
    await expect(page.getByTestId('slidesform-intro')).toBeVisible();
    await page.getByTestId('navigation-button').nth(1).click();

    // Wait for first slide to load
    await expect(page.getByTestId('node')).toBeVisible();
    await expect(page.getByTestId('slidesform-progress')).toBeVisible();
    await expect(page.getByText('Delmor')).toBeVisible();

    await page.getByTestId('navigation-button').nth(1).click();

    // Wait for second slide
    await expect(page.getByText('Rebecka')).toBeVisible();
    await expect.soft(page).toHaveScreenshot('per-alter-form.png');

    console.log('☑️ Per alter form');
  });

  testWithStore(
    'Sociogram',
    async ({ page, getSessionEdges, waitForEdgeCount }) => {
      await page.goto(`${baseInterviewURL}?step=7`);

      await expect(page.getByTestId('node')).toBeVisible();

      // Drag nodes with proper waiting
      const nodeLayout = page.getByTestId('node-layout');
      await nodeLayout.waitFor({ state: 'visible' });

      // Drag Alex
      const nodeA = page.getByText('Alex', { exact: true });
      await nodeA.dragTo(nodeLayout);
      await expect(nodeLayout.getByText('Alex')).toBeVisible();

      // Drag Burt with controlled movement
      const nodeB = page.getByText('Burt', { exact: true });
      await nodeB.hover();
      await page.mouse.down();
      await page.mouse.move(200, 100, { steps: 10 });
      await page.mouse.up();
      await expect(nodeLayout.getByText('Burt')).toBeVisible();

      // Drag Carrie
      const nodeC = page.getByText('Carrie', { exact: true });
      await nodeC.hover();
      await page.mouse.down();
      await page.mouse.move(400, 400, { steps: 10 });
      await page.mouse.up();
      await expect(nodeLayout.getByText('Carrie')).toBeVisible();

      // Proceed to the next step
      await page.getByTestId('navigation-button').nth(1).click();

      // Wait for the new prompt to be ready
      await page.waitForLoadState('networkidle');

      // Connect nodes and wait for edges to be created
      await nodeA.click();
      await nodeB.click();

      // Wait for edge to be created
      await waitForEdgeCount(page, 1);

      // Connect A & C
      await nodeA.click();
      await nodeC.click();

      await waitForEdgeCount(page, 2);

      // Remove connection between A & B
      await nodeA.click();
      await nodeB.click();

      await waitForEdgeCount(page, 1);

      // Wait for the correct edge state
      await expect(
        page.locator('line[stroke="var(--nc-edge-color-seq-1)"]'),
      ).toBeVisible();

      // Navigate to next prompt
      await page.getByTestId('navigation-button').nth(1).click();
      await page.waitForLoadState('networkidle');

      await nodeA.click();
      await nodeB.click();

      // Wait for new edge color
      await expect(
        page.locator('line[stroke="var(--nc-edge-color-seq-6)"]'),
      ).toBeVisible();

      // Wait for final edge state
      await waitForEdgeCount(page, 2);

      await expect.soft(page).toHaveScreenshot('sociogram.png');

      const edges = await getSessionEdges(page);
      expect(edges.length).toBe(2);
      console.log('☑️ Sociogram');
    },
  );

  testWithStore(
    'dyad census',
    async ({ page, getSessionEdges, waitForEdgeCount }) => {
      await page.goto(`${baseInterviewURL}?step=9`);
      await expect(page.getByTestId('dyad-introduction-heading')).toBeVisible();
      await page.getByTestId('navigation-button').nth(1).click();

      await expect(page.getByTestId('prompt')).toBeVisible();
      await expect(page.getByText('Delmor')).toBeVisible();
      await expect(page.getByText('Rebecka')).toBeVisible();

      await page.getByTestId('dyad-yes').click();

      // Wait for the next pair to appear
      await expect(page.getByText('Butch')).toBeVisible();
      await page.getByTestId('dyad-no').click();

      // Wait for Redux state to update
      await waitForEdgeCount(page, 3);

      const edges = await getSessionEdges(page);
      expect(edges.length).toBe(3);
      await expect.soft(page).toHaveScreenshot('dyad-census.png');

      console.log('☑️ Dyad census');
    },
  );

  test('tie strength census', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=10`);
    await expect(page.getByTestId('tiestrength-intro')).toBeVisible();
    await page.getByTestId('navigation-button').nth(1).click();

    await expect(page.getByTestId('prompt')).toBeVisible();
    await expect(page.getByText('Alex')).toBeVisible();
    await expect(page.getByText('Burt')).toBeVisible();

    await page.getByTestId('boolean-option').nth(1).click();

    // Wait for next pair
    await expect(page.getByText('Carrie')).toBeVisible();
    await expect.soft(page).toHaveScreenshot('tie-strength-census.png');

    await page.getByTestId('boolean-option').nth(3).click();

    console.log('☑️ tie strength census');
  });

  testWithStore(
    'per alter edge form',
    async ({ page, getSessionEdges, waitForEdgeCount }) => {
      await page.goto(`${baseInterviewURL}?step=11`);

      await expect(page.getByTestId('slidesform-intro')).toBeVisible();
      await page.getByTestId('navigation-button').nth(1).click();

      // Wait for first edge form
      await expect(page.getByText('Alex')).toBeVisible();
      await expect(page.getByText('Burt')).toBeVisible();
      await page.getByTestId('form-field-radio-input').nth(1).click();

      await page.getByTestId('navigation-button').nth(1).click();

      // Wait for second edge form
      await expect(page.getByText('Carrie')).toBeVisible();
      await page.getByTestId('form-field-radio-input').nth(0).click();

      // Wait for Redux state to update
      await waitForEdgeCount(page, 5);

      await expect.soft(page).toHaveScreenshot('per-alter-edge-form.png');

      const edges = await getSessionEdges(page);
      expect(edges.length).toBe(5);
      console.log('☑️ per alter edge form');
    },
  );

  testWithStore('sociogram - select', async ({ page, getSessionNodes }) => {
    await page.goto(`${baseInterviewURL}?step=12`);

    // Wait for nodes to be visible
    await expect(page.getByText('Alex', { exact: true })).toBeVisible();

    await page.getByText('Alex', { exact: true }).click();
    await page.getByText('Burt', { exact: true }).click();

    // Check for two selected nodes
    await expect(page.locator('.node--selected')).toHaveCount(2);

    // Next prompt
    await page.getByTestId('navigation-button').nth(1).click();

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');

    // Check for no selected nodes
    await expect(page.locator('.node--selected')).toHaveCount(0);

    await page.getByText('Carrie', { exact: true }).click();
    await expect(page.locator('.node--selected')).toHaveCount(1);

    // Wait for Redux state to update
    await page.waitForFunction(async () => {
      const nodes = await getSessionNodes(page);
      return nodes?.some((node) => node.attributes?.selected === true);
    });

    await expect(page.getByTestId('prompt')).toBeVisible();
    await expect.soft(page).toHaveScreenshot('sociogram-select.png');

    console.log('☑️ Sociogram - select');
  });

  test('ordinal bins', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=13`);
    await expect(page.getByTestId('prompt')).toBeVisible();

    // Wait for bins to be ready
    await page.getByTestId('ordinal-bin-0').waitFor({ state: 'visible' });
    await page.getByTestId('ordinal-bin-2').waitFor({ state: 'visible' });

    // Drag nodes to bins
    await page.getByTestId('node').dragTo(page.getByTestId('ordinal-bin-0'));

    // Wait for first node to be placed
    await expect(
      page.getByTestId('ordinal-bin-0').locator('.node'),
    ).toBeVisible();

    await page
      .getByTestId('node')
      .first()
      .dragTo(page.getByTestId('ordinal-bin-2'));

    // Wait for second node to be placed
    await expect(
      page.getByTestId('ordinal-bin-2').locator('.node'),
    ).toBeVisible();

    await expect.soft(page).toHaveScreenshot('ordinal-bins.png');

    console.log('☑️ Ordinal bins');
  });

  test('categorical bins', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=14`);
    await expect(page.getByTestId('prompt')).toBeVisible();

    // Wait for bins to be ready
    await page
      .getByTestId('categorical-list-item-0')
      .waitFor({ state: 'visible' });

    // First drag
    await page
      .getByTestId('node')
      .dragTo(page.getByTestId('categorical-list-item-0'));
    await expect(
      page.getByTestId('categorical-list-item-0').locator('.node'),
    ).toBeVisible();

    // Second drag
    await page
      .getByTestId('node')
      .first()
      .dragTo(page.getByTestId('categorical-list-item-4'));

    // Wait for form to appear
    await expect(
      page.getByText('Which context best describes how you know this person'),
    ).toBeVisible();

    await page.getByTestId('form-field-text-input').fill('Roommate');
    await page.click('button[type="submit"]');

    // Wait for form to close
    await page.waitForLoadState('networkidle');

    // Third drag
    await page
      .getByTestId('node')
      .first()
      .dragTo(page.getByTestId('categorical-list-item-0'));
    await expect(
      page.getByTestId('categorical-list-item-0').locator('.node'),
    ).toHaveCount(2);

    await expect.soft(page).toHaveScreenshot('categorical-bins.png');

    console.log('☑️ Categorical bins');
  });

  test('Skip logic/network filtering', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=15`);

    // This should show because we added 'Burt'
    await expect(page.getByText('Burt')).toBeVisible();
    await expect(page.getByTestId('prompt')).toBeVisible();

    console.log('☑️ Skip logic/network filtering');
  });

  test('narrative', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=16`);

    // Wait for interface to load
    await page
      .getByTestId('preset-switcher-label')
      .waitFor({ state: 'visible' });
    await page.getByTestId('preset-switcher-label').click();

    // Attributes should be visible
    await expect(page.locator('.node--selected')).toHaveCount(2);
    await page.getByTestId('form-field-radio-input').nth(1).click();

    // Wait for selection change
    await expect(page.getByTestId('node').first()).toBeVisible();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.node--selected')).toHaveCount(1);

    // Toggle links
    await page.getByTestId('accordion').nth(0).click();
    await expect(page.locator('.node--selected')).toHaveCount(0);
    await expect(page.getByTestId('edge-label-0')).toBeVisible();
    await expect(
      page.locator('line[stroke="var(--nc-edge-color-seq-1)"]'),
    ).toBeVisible();
    await expect(
      page.locator('line[stroke="var(--nc-edge-color-seq-6)"]'),
    ).toBeVisible();

    // Toggle groups
    await page.getByTestId('accordion').nth(1).click();

    // Lines should not be visible
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

    // Draw on the canvas
    await page.mouse.move(200, 200);
    await page.mouse.down();
    await page.mouse.move(200, 300, { steps: 5 });
    await page.mouse.move(300, 300, { steps: 5 });
    await page.mouse.move(300, 200, { steps: 5 });
    await page.mouse.up();

    // Check for the line
    await expect(page.getByTestId('annotation-path')).toBeVisible();

    // Reset
    await page.getByTestId('reset-narrative-button').click();
    await expect(page.getByTestId('annotation-path')).not.toBeVisible();

    await expect.soft(page).toHaveScreenshot('narrative.png');

    console.log('☑️ Narrative');
  });

  test('Finish interview', async ({ page }) => {
    await page.goto(`${baseInterviewURL}?step=17`);
    await page.getByTestId('finish-interview-button').click();

    // Wait for confirmation dialog
    await page
      .getByTestId('confirm-dialog-button')
      .waitFor({ state: 'visible' });
    await page.getByTestId('confirm-dialog-button').click();

    // Wait for completion
    await expect(page.getByTestId('interview-completed')).toBeVisible();

    console.log('☑️ Finish interview');
  });
});
