/**
 * SILOS Protocol Tests
 *
 * Tests interview stage navigation using a real .netcanvas protocol file.
 * Includes both the happy path (male at birth) and the female ineligibility path.
 */

import path from 'node:path';
import { expect, test } from '~/tests/e2e/fixtures/interview-test.js';
import { expectURL } from '~/tests/e2e/helpers/expectations.js';

const SILOS_PROTOCOL_PATH = path.resolve(
  import.meta.dirname,
  '../../data/silos.netcanvas',
);

// Shared protocol ID across all test suites
let sharedProtocolId: string;

test.describe('SILOS Protocol', () => {
  // Install protocol once for all nested suites
  test.beforeAll(async ({ database, protocol }) => {
    await database.restoreSnapshot();
    const { protocolId } = await protocol.install(SILOS_PROTOCOL_PATH);
    sharedProtocolId = protocolId;
  });

  test.describe('Happy Path (Male at Birth)', () => {
    test.describe.configure({ mode: 'serial' });

    let interviewId: string;

    test.beforeAll(async ({ protocol }) => {
      interviewId = await protocol.createInterview(sharedProtocolId);
    });

    test.beforeEach(({ interview }) => {
      interview.interviewId = interviewId;
    });

    test.afterEach(async ({ page, interview }) => {
      // Capture screenshot at end of each stage
      const stepMatch = /step=(\d+)/.exec(page.url());
      if (stepMatch?.[1]) {
        const step = stepMatch[1];
        // Sociogram stages (13, 14) have non-deterministic node positions
        const sociogramStages = ['13', '14'];

        await interview.capture(`stage-${step}-final`, {
          maxDiffPixelRatio: sociogramStages.includes(step) ? 0.1 : undefined,
        });
      }
    });

    test('Stage 0: Welcome', async ({ page, interview }) => {
      await interview.goto(0);

      // Verify welcome stage content
      await expect(
        page.getByRole('heading', { name: 'Welcome!' }),
      ).toBeVisible();

      // Information stage - should be able to proceed immediately
      await expect(interview.nextButton).toBeEnabled();
    });

    test('Stage 1: Getting Started', async ({ page, interview }) => {
      await interview.goto(1);

      // Verify getting started stage content
      await expect(
        page.getByRole('heading', { name: 'Getting Started' }),
      ).toBeVisible();

      const video = page.locator('video');
      await expect(video).toBeVisible();

      // Information stage - should be able to proceed immediately
      await expect(interview.nextButton).toBeEnabled();
    });

    test('Stage 2: Self-Nomination', async ({ interview, stage, protocol }) => {
      await interview.goto(2);

      // Quick add should be enabled initially
      expect(await stage.quickAdd.isDisabled()).toBe(false);

      // Add the ego node using quick add
      await stage.quickAdd.addNode('Me');

      // Verify node was added
      await expect(stage.getNode('Me')).toBeVisible();

      // Quick add should be disabled (max 1 ego node)
      expect(await stage.quickAdd.isDisabled()).toBe(true);

      // Validation released - pulse animation visible
      expect(await interview.nextButtonHasPulse()).toBe(true);

      // Test deleting the node using keyboard (Ctrl+D, arrow keys, Enter)
      await stage.deleteNode('Me');

      // Verify the node was deleted
      await expect(stage.getNode('Me')).not.toBeVisible();

      // Quick add should be enabled again
      expect(await stage.quickAdd.isDisabled()).toBe(false);

      // Add the node again to proceed
      await stage.quickAdd.addNode('Me');
      await expect(stage.getNode('Me')).toBeVisible();
      await expect(interview.nextButton).toBeEnabled();

      // Wait for sync middleware to persist the node to database
      await protocol.waitForNodes(interview.interviewId, 1);
    });

    test('Stage 3: Ego Information (EgoForm)', async ({
      page,
      interview,
      stage,
    }) => {
      await interview.goto(3);

      // Verify the form heading is visible
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // EgoForm has required fields - next button should not have pulse initially
      expect(await interview.nextButtonHasPulse()).toBe(false);

      // Try to proceed without filling required fields
      await interview.nextButton.click();

      // Verify we're still on stage 3 (proceeding was blocked)
      await expectURL(page, /step=3/);

      // Verify validation errors are shown (years in chicagoland field)
      await expect(
        stage.form.getFieldError('817b4886-bf32-431b-adce-81cbc3fcf233'),
      ).toBeVisible();

      // Fill all required fields using form fixture
      // Field names are UUID variable IDs from the protocol

      // 1. Date of birth (DatePicker)
      await stage.form.fillDate(
        '596c2ac2-9fd4-42f4-a0f3-cfa7f1676551',
        '2000-06-15',
      );

      // 2. Sexual identity (CheckboxGroup)
      await stage.form.selectCheckbox(
        '4d9cd886-2834-48ce-ba80-38a0dc9a5dd6',
        'Gay',
      );

      // 3. Sex assigned at birth (ToggleButtonGroup)
      await stage.form.selectToggleButton(
        'f3d7559b-3a07-4719-8e4a-1db49d270f7b',
        'Male',
      );

      // 4. Gender identity (RadioGroup)
      await stage.form.selectRadio(
        'a06f06f5-b688-487c-8e3b-ca916aed2b84',
        'Cisgender Male',
      );

      // 5. Race/ethnicity (CheckboxGroup)
      await stage.form.selectCheckbox(
        '92869afe-a300-404c-a390-5fbc3f48cf25',
        'White',
      );

      // 6. Hispanic/Latino (Boolean)
      await stage.form.selectRadio(
        'dc6779f2-4c6f-48bb-9e9c-2f6f014cf620',
        'Not Hispanic or Latino',
      );

      // 7. Years lived in Chicagoland (Number input)
      await stage.form.fillNumber('817b4886-bf32-431b-adce-81cbc3fcf233', '10');

      // 8. HIV status (RadioGroup)
      await stage.form.selectRadio(
        'fe681ff5-adaf-40b8-8376-20b5f53c93c7',
        'HIV Negative',
      );

      await expect(interview.nextButton).toBeEnabled();
    });

    // Stages 4-5 are skipped (conditional on Female sex assigned at birth)

    test('Stage 6: Ego Information - Perceived by Others', async ({
      page,
      interview,
      stage,
    }) => {
      await interview.goto(6);

      // Verify the form heading is visible
      await expect(
        page.getByRole('heading', { name: 'About You', level: 1 }),
      ).toBeVisible();

      // Fill all fields
      // 1. Perceived Race (RadioGroup)
      await stage.form.selectRadio(
        '8a4af15c-394b-45eb-915d-6a150191758a',
        'White',
      );

      // 2. Perceived Hispanic (Boolean)
      await stage.form.selectRadio(
        '4f26a2c2-53c0-4802-b955-c84c8ca46c12',
        'Not Hispanic or Latino',
      );

      // 3. Perceived Gender (RadioGroup)
      await stage.form.selectRadio(
        '648cb03d-7119-405f-98d7-9d4b6e5ec097',
        'Cisgender Man',
      );

      // 4. Perceived Sexual Identity (RadioGroup)
      await stage.form.selectRadio(
        '0848da8d-c6b0-48c1-8520-b62dfc45212d',
        'Gay',
      );

      await expect(interview.nextButton).toBeEnabled();
    });

    test('Stage 7: Map Selection Information', async ({ page, interview }) => {
      await interview.goto(7);

      await expect(
        page.getByRole('heading', { name: 'Map Selection' }),
      ).toBeVisible();

      const video = page.locator('video');
      await expect(video).toBeVisible();

      // Information stage - should be able to proceed immediately
      await expect(interview.nextButton).toBeEnabled();
    });

    test('Stage 8: Geospatial Interface', async ({
      interview,
      stage,
      browserName,
    }) => {
      // Skip on Firefox - Playwright's Firefox lacks WebGL support for Mapbox GL JS
      // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1375585
      test.skip(
        browserName === 'firefox',
        'Firefox lacks WebGL support in Playwright',
      );

      await interview.goto(8);

      // --- Verify prompt is visible ---
      await expect(stage.getPrompt()).toBeVisible();

      // --- Verify core UI elements are visible ---
      await expect(stage.geospatial.mapContainer).toBeVisible();
      await expect(stage.geospatial.toolbar).toBeVisible();

      // Verify the current node (Me) is displayed
      await expect(stage.geospatial.getNode('Me')).toBeVisible();

      // --- Wait for map to fully load with all layers ---
      await stage.geospatial.waitForMapLoad();
      expect(await stage.geospatial.isMapLoaded()).toBe(true);

      // --- Test zoom controls ---
      await expect(stage.geospatial.zoomInButton).toBeVisible();
      await expect(stage.geospatial.zoomOutButton).toBeVisible();
      await expect(stage.geospatial.recenterButton).toBeVisible();

      // Click zoom controls
      await stage.geospatial.zoomIn();
      await stage.geospatial.zoomOut();
      await stage.geospatial.recenter();

      // --- Test search toggle ---
      await expect(stage.geospatial.searchToggle).toBeVisible();

      // Open search panel
      await stage.geospatial.openSearch();
      expect(await stage.geospatial.isSearchOpen()).toBe(true);

      // Verify search input is visible
      await expect(stage.geospatial.searchInput).toBeVisible();

      // --- Test actual search functionality ---
      await stage.geospatial.searchInput.fill('Sidetrack');

      // Wait for suggestions to appear
      await expect(stage.geospatial.getSuggestions().first()).toBeVisible({
        timeout: 10000,
      });

      // Verify we got suggestions
      const suggestionCount = await stage.geospatial.getSuggestions().count();
      expect(suggestionCount).toBeGreaterThan(0);

      // Select the first suggestion - this should pan the map
      await stage.geospatial.getSuggestions().first().click();

      // Clear search and close panel
      await stage.geospatial.closeSearch();
      expect(await stage.geospatial.isSearchOpen()).toBe(false);

      // --- Test map selection by clicking on a selectable area ---
      // The silos protocol uses Chicago neighborhoods - click near center of map
      // which should be within the selectable GeoJSON area
      await stage.geospatial.clickOnMap(0.5, 0.5);

      // Validation should be released after selecting an area
      // Wait for the selection to register and pulse to appear
      await expect
        .poll(() => interview.nextButtonHasPulse(), { timeout: 5000 })
        .toBe(true);

      // --- Test deselection by clicking "Outside Selectable Areas" ---
      // This will replace the map selection with "outside-selectable-areas"
      await stage.geospatial.selectOutsideSelectableAreas();

      // Verify overlay appears
      await expect(stage.geospatial.outsideSelectableOverlay).toBeVisible();
      expect(await stage.geospatial.isOutsideSelectableAreasSelected()).toBe(
        true,
      );

      // Verify the button is now disabled (can't select again)
      await expect(
        stage.geospatial.outsideSelectableAreasButton,
      ).toBeDisabled();

      // Validation should still be released (we have a selection)
      expect(await interview.nextButtonHasPulse()).toBe(true);

      // Deselect the outside area
      await stage.geospatial.deselectOutsideArea();

      // Verify overlay disappears
      await expect(stage.geospatial.outsideSelectableOverlay).not.toBeVisible();
      expect(await stage.geospatial.isOutsideSelectableAreasSelected()).toBe(
        false,
      );

      // Button should be enabled again
      await expect(stage.geospatial.outsideSelectableAreasButton).toBeEnabled();

      // Pulse should be gone (no selection)
      expect(await interview.nextButtonHasPulse()).toBe(false);

      // --- Make a selection to proceed to next stage ---
      // Click on map to select an area
      await stage.geospatial.clickOnMap(0.5, 0.5);
      await expect
        .poll(() => interview.nextButtonHasPulse(), { timeout: 5000 })
        .toBe(true);

      await expect(interview.nextButton).toBeEnabled();
    });

    test('Stage 9: Ego Substances', async ({ page, interview, stage }) => {
      await interview.goto(9);

      // Verify the form heading is visible
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // Fill all fields (all Boolean - Yes/No)
      // 1. Marijuana use (Boolean)
      await stage.form.selectRadio(
        '4ff3010b-4706-4e40-9a9e-0735b50c489f',
        'Yes',
      );

      // 2. Cocaine use (Boolean)
      await stage.form.selectRadio(
        '14cd06ba-6a48-403b-99a4-3ba97ed9523f',
        'Yes',
      );

      // 3. Heroin use (Boolean)
      await stage.form.selectRadio(
        '9e3c5efd-412d-40e3-9e30-fc53d8a8eb0a',
        'No',
      );

      // 4. Painkillers/opiates use (Boolean)
      await stage.form.selectRadio(
        '62b4364d-9802-4faa-8c35-61db120d24d6',
        'No',
      );

      // 5. Poppers use (Boolean)
      await stage.form.selectRadio(
        '220b8a1a-2001-4e22-a240-195bca3f63dd',
        'No',
      );

      // 6. Methamphetamine use (Boolean)
      await stage.form.selectRadio(
        '6655b2bb-59bb-4584-b1bb-19de37fdf0f3',
        'No',
      );

      await expect(interview.nextButton).toBeEnabled();
    });

    test('Stage 10: Name Generator Instructions', async ({
      page,
      interview,
    }) => {
      await interview.goto(10);

      // Verify the heading is visible
      await expect(
        page.getByRole('heading', { name: 'People in Your Life' }),
      ).toBeVisible();

      const video = page.locator('video');
      await expect(video).toBeVisible();

      // Information stage - should be able to proceed immediately
      await expect(interview.nextButton).toBeEnabled();
    });

    test('Stage 11: Name Generator (Close Ties and Drug)', async ({
      page,
      interview,
      stage,
      protocol,
    }) => {
      await interview.goto(11);

      // Verify the first prompt is visible (close ties)
      await expect(stage.getPrompt()).toBeVisible();

      // --- Test validation: attempt to add person without required age ---
      await stage.nameGenerator.openAddForm();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Fill name and relationship, but NOT age
      await stage.form.fillText('b1eb909a-13cd-4dc6-ab90-c77e7bc2c5d3', 'Dan');
      await stage.form.selectToggleButton(
        '8f5d456b-06fb-4958-9a92-da6e87008bce',
        'Romantic Partner',
      );

      // Attempt to submit - should be blocked due to missing age
      const submitButton = page.getByRole('button', { name: 'Finished' });
      await submitButton.click();

      // Dialog should still be open (submission was blocked)
      await expect(page.getByRole('dialog')).toBeVisible();

      // Verify validation error is shown for age field
      await expect(
        stage.form.getFieldError('6621dc88-9cde-43a1-85ec-6fc7689b2211'),
      ).toBeVisible();

      // Now fill the age and submit successfully
      await stage.form.fillNumber('6621dc88-9cde-43a1-85ec-6fc7689b2211', '27');
      await stage.nameGenerator.submitForm();

      // Verify romantic partner was added
      await expect(stage.getNode('Dan')).toBeVisible();

      // Validation released - pulse animation visible
      expect(await interview.nextButtonHasPulse()).toBe(true);

      // --- Add more nodes (friends) ---
      await stage.nameGenerator.openAddForm();
      await stage.form.fillText(
        'b1eb909a-13cd-4dc6-ab90-c77e7bc2c5d3',
        'Alice',
      );
      await stage.form.fillNumber('6621dc88-9cde-43a1-85ec-6fc7689b2211', '17');
      await stage.form.selectToggleButton(
        '8f5d456b-06fb-4958-9a92-da6e87008bce',
        'Friend',
      );
      await stage.nameGenerator.submitForm();
      await expect(stage.getNode('Alice')).toBeVisible();

      await stage.nameGenerator.openAddForm();
      await stage.form.fillText('b1eb909a-13cd-4dc6-ab90-c77e7bc2c5d3', 'Bob');
      await stage.form.fillNumber('6621dc88-9cde-43a1-85ec-6fc7689b2211', '30');
      await stage.form.selectToggleButton(
        '8f5d456b-06fb-4958-9a92-da6e87008bce',
        'Friend',
      );
      await stage.nameGenerator.submitForm();
      await expect(stage.getNode('Bob')).toBeVisible();

      // --- Proceed to next prompt (drug use) ---
      await interview.nextButton.click();

      // Verify we're on the second prompt (drug use)
      await expect(
        stage.getPrompt(/marijuana|drugs/i),
      ).toBeVisible();

      // --- Test drag and drop from side panel ---
      // The side panel should show previously added nodes
      await expect(stage.nodePanel.panel).toBeVisible();

      // Find Alice in the side panel
      await expect(stage.nodePanel.getNode('Alice')).toBeVisible();

      // Get the drop target (node list/canvas area)
      const mainList = page.getByTestId('node-list');

      // Verify Alice is NOT in the main node list before drag
      const aliceInMainList = mainList.getByRole('option', { name: 'Alice' });
      await expect(aliceInMainList).not.toBeVisible();

      // Perform drag and drop using fixture
      await stage.nodePanel.dragNodeToMainList('Alice');

      // Verify Alice now appears in the main node list (not just the panel)
      await expect(aliceInMainList).toBeVisible();

      await expect(interview.nextButton).toBeEnabled();

      // Wait for sync middleware to persist the addNodeToPrompt update to database.
      // waitForNodes(3) is insufficient because the 3 nodes already existed before the
      // drag — the drag only updates Alice's promptIDs and additional attributes.
      // Poll until Alice has 2 promptIDs (close ties + drug prompt).
      await expect
        .poll(
          async () => {
            const state = await protocol.getNetworkState(interview.interviewId);
            const alice = state.nodes.find((n) =>
              Object.values(n.attributes).includes('Alice'),
            );
            return alice?.attributes['45032017-155e-4499-9e7f-2abbfc6cc441'];
          },
          { timeout: 15000, intervals: [500] },
        )
        .toBe(true);
    });

    test('Stage 12: Sex Partner Nomination', async ({
      page,
      interview,
      stage,
      protocol,
    }) => {
      await interview.goto(12);

      await expect(stage.getPrompt()).toBeVisible();

      // --- Verify Alice is NOT in the side panel (she's 17, under 18 filter) ---
      await expect(stage.nodePanel.panel).toBeVisible();
      await expect(stage.nodePanel.getNode('Alice')).not.toBeVisible();

      // Bob (age 30) and Dan (age 27) should be visible in the panel
      await expect(stage.nodePanel.getNode('Bob')).toBeVisible();

      // --- Create one new person ---
      await stage.nameGenerator.openAddForm();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Fill form fields (this stage uses different age variable)
      await stage.form.fillText('b1eb909a-13cd-4dc6-ab90-c77e7bc2c5d3', 'Evan');
      await stage.form.fillNumber('9dace85f-af41-4091-9209-389f0a24104a', '24');

      await stage.nameGenerator.submitForm();
      await expect(stage.getNode('Evan')).toBeVisible();

      // --- Drag Bob from side panel ---
      const mainList = page.getByTestId('node-list');

      // Verify Bob is NOT in the main list before drag
      const bobInMainList = mainList.getByRole('option', { name: 'Bob' });
      await expect(bobInMainList).not.toBeVisible();

      // Perform drag and drop using fixture
      await stage.nodePanel.dragNodeToMainList('Bob');

      // Verify Bob now appears in the main node list
      await expect(bobInMainList).toBeVisible();

      await expect(interview.nextButton).toBeEnabled();

      // Wait for sync middleware to persist Evan to the database.
      // waitForNodes(4) is insufficient because it checks count, not content —
      // addNodeToPrompt for Bob may trigger a sync that satisfies the count
      // before Evan's creation is persisted.
      await expect
        .poll(
          async () => {
            const state = await protocol.getNetworkState(interview.interviewId);
            return state.nodes.some((n) =>
              Object.values(n.attributes).includes('Evan'),
            );
          },
          { timeout: 15000, intervals: [500] },
        )
        .toBe(true);
    });

    test('Stage 13: Sociogram (Close Ties and Drug Partners)', async ({
      interview,
      stage,
    }) => {
      // Sociogram has non-deterministic force-directed node layout
      await interview.goto(13, { maxDiffPixelRatio: 0.1 });

      // Verify the first prompt is visible (connect close ties)
      await expect(stage.getPrompt()).toBeVisible();

      // Verify nodes are visible on the canvas
      await expect(stage.sociogram.getNode('Dan')).toBeVisible();
      await expect(stage.sociogram.getNode('Alice')).toBeVisible();
      await expect(stage.sociogram.getNode('Bob')).toBeVisible();

      // --- Test edge creation: connect Dan and Bob ---
      // Initially no edges should exist
      await expect.poll(() => stage.sociogram.getEdgeCount()).toBe(0);

      // Connect Dan and Bob
      await stage.sociogram.connectNodes('Dan', 'Bob');

      // Verify edge was created
      await expect.poll(() => stage.sociogram.getEdgeCount()).toBe(1);

      // --- Test edge removal: disconnect Dan and Bob ---
      await stage.sociogram.disconnectNodes('Dan', 'Bob');

      // Verify edge was removed
      await expect.poll(() => stage.sociogram.getEdgeCount()).toBe(0);

      // --- Test creating another edge: connect Dan and Alice ---
      await stage.sociogram.connectNodes('Dan', 'Alice');

      // Verify edge was created
      await expect.poll(() => stage.sociogram.getEdgeCount()).toBe(1);

      // --- Proceed to next prompt (drug partners highlighting) ---
      await interview.nextButton.click();

      // Verify we're on the second prompt (drug partners)
      await expect(stage.getPrompt(/drug/i)).toBeVisible();

      // --- Test highlighting: Alice should already be highlighted ---
      // Alice was added to the drug use prompt in Stage 11, so she should be highlighted
      await expect(stage.sociogram.getNode('Alice')).toHaveAttribute(
        'data-node-highlighted',
        'true',
      );

      // --- Test unhighlighting: untap Alice ---
      await stage.sociogram.toggleHighlight('Alice');

      // Verify Alice is no longer highlighted (attribute is removed when false)
      await expect(stage.sociogram.getNode('Alice')).not.toHaveAttribute(
        'data-node-highlighted',
      );

      // --- Test re-highlighting: tap Alice again ---
      await stage.sociogram.toggleHighlight('Alice');

      // Verify Alice is highlighted again
      await expect(stage.sociogram.getNode('Alice')).toHaveAttribute(
        'data-node-highlighted',
        'true',
      );

      await expect(interview.nextButton).toBeEnabled();
    });

    // Stage 14 is Sex Sociogram - skipped if no sex partners nominated

    test('Stage 15: Ordinal Bins (Relationship Strength)', async ({
      page,
      interview,
      stage,
    }) => {
      await interview.goto(15);

      // Verify the prompt is visible
      await expect(stage.getPrompt()).toBeVisible();

      // Verify bins are visible (from protocol: Very close, Close, Somewhat close, Not very close, Not close at all)
      await expect(
        page.getByRole('heading', {
          name: 'Very close',
          level: 4,
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Close', level: 4, exact: true }),
      ).toBeVisible();

      // Verify nodes are in the drawer (unplaced)
      // We should have: Dan, Alice, Bob, Evan from previous stages
      const initialUnplacedCount = await stage.ordinalBin.getUnplacedCount();
      expect(initialUnplacedCount).toBeGreaterThanOrEqual(4);

      // --- Drag all nodes from drawer to bins ---

      // Drag Dan to "Very close"
      await stage.ordinalBin.dragNodeToBin('Dan', 'Very close');
      expect(await stage.ordinalBin.isNodeInBin('Dan', 'Very close')).toBe(
        true,
      );

      // Drag Alice to "Close"
      await stage.ordinalBin.dragNodeToBin('Alice', 'Close');
      expect(await stage.ordinalBin.isNodeInBin('Alice', 'Close')).toBe(true);

      // Drag Bob to "Somewhat close"
      await stage.ordinalBin.dragNodeToBin('Bob', 'Somewhat close');
      expect(await stage.ordinalBin.isNodeInBin('Bob', 'Somewhat close')).toBe(
        true,
      );

      // Drag Evan to "Not very close"
      await stage.ordinalBin.dragNodeToBin('Evan', 'Not very close');
      expect(await stage.ordinalBin.isNodeInBin('Evan', 'Not very close')).toBe(
        true,
      );

      // Verify unplaced count decreased
      const afterDragUnplacedCount = await stage.ordinalBin.getUnplacedCount();
      expect(afterDragUnplacedCount).toBe(initialUnplacedCount - 4);

      // --- Move a node from one bin to another ---
      // Move Dan from "Very close" to "Close"
      await stage.ordinalBin.moveNodeBetweenBins('Dan', 'Very close', 'Close');

      // Verify Dan is now in "Close" and not in "Very close"
      expect(await stage.ordinalBin.isNodeInBin('Dan', 'Close')).toBe(true);
      expect(await stage.ordinalBin.isNodeInBin('Dan', 'Very close')).toBe(
        false,
      );

      await expect(interview.nextButton).toBeEnabled();
    });

    test('Stage 16: Categorical Bins (4 prompts)', async ({
      interview,
      stage,
    }) => {
      await interview.goto(16);

      // ========== PROMPT 1: Gender ==========
      await expect(stage.getPrompt()).toBeVisible();

      // Verify category bins are visible
      await expect(
        stage.categoricalBin.getBin('Cisgender Female'),
      ).toBeVisible();
      await expect(stage.categoricalBin.getBin('Cisgender Male')).toBeVisible();

      // Verify nodes are in the drawer (uncategorized)
      const genderUncategorizedCount =
        await stage.categoricalBin.getUnplacedCount();
      expect(genderUncategorizedCount).toBeGreaterThanOrEqual(4);

      // Drag all nodes to gender bins
      await stage.categoricalBin.dragNodeToBin('Dan', 'Cisgender Male');
      await stage.categoricalBin.dragNodeToBin('Alice', 'Cisgender Female');
      await stage.categoricalBin.dragNodeToBin('Bob', 'Cisgender Male');
      await stage.categoricalBin.dragNodeToBin('Evan', 'Cisgender Male');

      // Verify counts
      expect(
        await stage.categoricalBin.getNodeCountInBin('Cisgender Male'),
      ).toBe(3);
      expect(
        await stage.categoricalBin.getNodeCountInBin('Cisgender Female'),
      ).toBe(1);

      // Move Dan to test bin-to-bin movement
      await stage.categoricalBin.moveNodeBetweenBins(
        'Dan',
        'Cisgender Male',
        'Cisgender Female',
      );
      expect(
        await stage.categoricalBin.getNodeCountInBin('Cisgender Female'),
      ).toBe(2);

      await expect(interview.nextButton).toBeEnabled();

      // ========== PROMPT 2: Hispanic/Latino ==========
      await interview.nextButton.click();
      await expect(stage.getPrompt(/Hispanic/i)).toBeVisible();

      // Verify bins
      await expect(
        stage.categoricalBin.getBin('Hispanic or Latino'),
      ).toBeVisible();
      await expect(
        stage.categoricalBin.getBin('Not Hispanic or Latino'),
      ).toBeVisible();

      // Drag all nodes
      await stage.categoricalBin.dragNodeToBin('Dan', 'Not Hispanic or Latino');
      await stage.categoricalBin.dragNodeToBin(
        'Alice',
        'Not Hispanic or Latino',
      );
      await stage.categoricalBin.dragNodeToBin('Bob', 'Hispanic or Latino');
      await stage.categoricalBin.dragNodeToBin(
        'Evan',
        'Not Hispanic or Latino',
      );

      // Verify counts
      expect(
        await stage.categoricalBin.getNodeCountInBin('Not Hispanic or Latino'),
      ).toBe(3);
      expect(
        await stage.categoricalBin.getNodeCountInBin('Hispanic or Latino'),
      ).toBe(1);

      await expect(interview.nextButton).toBeEnabled();

      // ========== PROMPT 3: Race/Ethnicity ==========
      await interview.nextButton.click();
      await expect(
        stage.getPrompt(/race|ethnic/i),
      ).toBeVisible();

      // Verify bins
      await expect(stage.categoricalBin.getBin('White')).toBeVisible();
      await expect(stage.categoricalBin.getBin('Black')).toBeVisible();

      // Drag all nodes
      await stage.categoricalBin.dragNodeToBin('Dan', 'White');
      await stage.categoricalBin.dragNodeToBin('Alice', 'White');
      await stage.categoricalBin.dragNodeToBin('Bob', 'Black');
      await stage.categoricalBin.dragNodeToBin('Evan', 'Asian');

      // Verify counts
      expect(await stage.categoricalBin.getNodeCountInBin('White')).toBe(2);
      expect(await stage.categoricalBin.getNodeCountInBin('Black')).toBe(1);
      expect(await stage.categoricalBin.getNodeCountInBin('Asian')).toBe(1);

      await expect(interview.nextButton).toBeEnabled();

      // ========== PROMPT 4: Sexual Identity ==========
      await interview.nextButton.click();
      await expect(
        stage.getPrompt(/sexual identity/i),
      ).toBeVisible();

      // Verify bins
      await expect(stage.categoricalBin.getBin('Gay')).toBeVisible();
      await expect(stage.categoricalBin.getBin('Straight')).toBeVisible();

      // Drag all nodes
      await stage.categoricalBin.dragNodeToBin('Dan', 'Gay');
      await stage.categoricalBin.dragNodeToBin('Alice', 'Straight');
      await stage.categoricalBin.dragNodeToBin('Bob', 'Bisexual');
      await stage.categoricalBin.dragNodeToBin('Evan', 'Gay');

      // Verify counts
      expect(await stage.categoricalBin.getNodeCountInBin('Gay')).toBe(2);
      expect(await stage.categoricalBin.getNodeCountInBin('Straight')).toBe(1);
      expect(await stage.categoricalBin.getNodeCountInBin('Bisexual')).toBe(1);

      await expect(interview.nextButton).toBeEnabled();
    });
  }); // End of Happy Path describe

  /**
   * Female at Birth Ineligibility Path
   *
   * Tests the edge case where a participant selects "Female" as their
   * sex assigned at birth, which triggers the ineligibility flow:
   * - Stage 4: Sex confirmation ("Is this correct?")
   * - Stage 5: Ineligibility notice
   * - Skip to interview end
   */
  test.describe('Female Ineligibility Path', () => {
    test.describe.configure({ mode: 'serial' });

    let interviewId: string;

    test.beforeAll(async ({ protocol }) => {
      interviewId = await protocol.createInterview(sharedProtocolId);
    });

    test.beforeEach(({ interview }) => {
      interview.interviewId = interviewId;
      interview.snapshotPrefix = 'female-ineligibility';
    });

    test('Stage 0: Welcome', async ({ page, interview }) => {
      await interview.goto(0);

      await expect(
        page.getByRole('heading', { name: 'Welcome!' }),
      ).toBeVisible();
      await expect(interview.nextButton).toBeEnabled();
    });

    test('Stage 1: Getting Started', async ({ page, interview }) => {
      await interview.goto(1);

      await expect(
        page.getByRole('heading', { name: 'Getting Started' }),
      ).toBeVisible();

      const video = page.locator('video');
      await expect(video).toBeVisible();

      await expect(interview.nextButton).toBeEnabled();
    });

    test('Stage 2: Self-Nomination', async ({ interview, stage, protocol }) => {
      await interview.goto(2);

      // Add the ego node
      await stage.quickAdd.addNode('Me');
      await expect(stage.getNode('Me')).toBeVisible();

      // Validation released
      expect(await interview.nextButtonHasPulse()).toBe(true);

      // Wait for sync
      await protocol.waitForNodes(interview.interviewId, 1);
    });

    test('Stage 3: Ego Form - Select Female at Birth', async ({
      page,
      interview,
      stage,
      protocol,
    }) => {
      await interview.goto(3);

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // Fill all required fields using UUID-based methods (same as Happy Path)
      // Field names are UUID variable IDs from the protocol

      // 1. Date of birth (DatePicker)
      await stage.form.fillDate(
        '596c2ac2-9fd4-42f4-a0f3-cfa7f1676551',
        '1998-06-10',
      );

      // 2. Sexual identity (CheckboxGroup) - select Bisexual
      await stage.form.selectCheckbox(
        '4d9cd886-2834-48ce-ba80-38a0dc9a5dd6',
        'Bisexual',
      );

      // 3. Sex assigned at birth (ToggleButtonGroup) - select FEMALE (triggers ineligibility)
      await stage.form.selectToggleButton(
        'f3d7559b-3a07-4719-8e4a-1db49d270f7b',
        'Female',
      );

      // 4. Gender identity (RadioGroup)
      await stage.form.selectRadio(
        'a06f06f5-b688-487c-8e3b-ca916aed2b84',
        'Cisgender Female',
      );

      // 5. Race/ethnicity (CheckboxGroup)
      await stage.form.selectCheckbox(
        '92869afe-a300-404c-a390-5fbc3f48cf25',
        'White',
      );

      // 6. Hispanic/Latino (Boolean)
      await stage.form.selectRadio(
        'dc6779f2-4c6f-48bb-9e9c-2f6f014cf620',
        'Hispanic or Latino',
      );

      // 7. Years lived in Chicagoland (Number input)
      await stage.form.fillNumber('817b4886-bf32-431b-adce-81cbc3fcf233', '5');

      // 8. HIV status (RadioGroup)
      await stage.form.selectRadio(
        'fe681ff5-adaf-40b8-8376-20b5f53c93c7',
        'HIV Negative',
      );

      await expect(interview.nextButton).toBeEnabled();

      // Click Next - this submits the form to Redux and triggers navigation.
      await interview.nextButton.click();

      // Should navigate to stage 4 (sex confirmation)
      await expectURL(page, /step=4/);

      await protocol.waitForEgoAttribute(
        interview.interviewId,
        'f3d7559b-3a07-4719-8e4a-1db49d270f7b', // sex assigned at birth
        ['Female'],
      );
    });

    test('Stage 4: Sex Assigned at Birth Confirmation', async ({
      page,
      interview,
      stage,
      protocol,
    }) => {
      await interview.goto(4);

      await expect(
        page.getByRole('heading', { name: 'Your Sex Assigned at Birth' }),
      ).toBeVisible();

      // Confirm "Yes" - use field UUID for sex confirmation
      await stage.form.selectRadio(
        'f249c2d1-3f54-49a9-83d8-81e2387df5e5',
        'Yes',
      );

      await expect(interview.nextButton).toBeEnabled();

      // Proceed to ineligibility screen
      await interview.nextButton.click();

      // Should navigate to stage 5 (ineligibility)
      await expectURL(page, /step=5/);

      await protocol.waitForEgoAttribute(
        interview.interviewId,
        'f249c2d1-3f54-49a9-83d8-81e2387df5e5', // sex assigned at birth confirmation
        true,
      );
    });

    test('Stage 5: Ineligibility Notice', async ({ page, interview }) => {
      await interview.goto(5);

      await expect(
        page.getByRole('heading', { name: 'Study Ineligibility' }),
      ).toBeVisible();

      await expect(interview.nextButton).toBeEnabled();
    });

    test.fixme('Skip to End and Finish Interview', async () => {
      // TODO: proceed to end and verify end screen, verify finish interview
    });
  }); // End of Female Ineligibility Path describe
});
