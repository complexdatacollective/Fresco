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
  // Run all nested suites in one worker to prevent parallel workers from
  // calling restoreSnapshot() and wiping each other's dynamically installed protocols.
  test.describe.configure({ mode: 'serial' });

  // Install protocol once for all nested suites
  test.beforeAll(async ({ protocol }) => {
    const { protocolId } = await protocol.install(SILOS_PROTOCOL_PATH);
    sharedProtocolId = protocolId;
  });

  test.describe('Happy Path (Male at Birth)', () => {
    test.describe.configure({ mode: 'serial' });

    let interviewId: string;
    let navigatedToStart = false;

    test.beforeAll(async ({ protocol }) => {
      interviewId = await protocol.createInterview(sharedProtocolId);
      navigatedToStart = false;
    });

    test.beforeEach(async ({ interview }) => {
      interview.interviewId = interviewId;
      if (!navigatedToStart) {
        await interview.goto(0);
        navigatedToStart = true;
      }
    });

    test.afterEach(async ({ interview }) => {
      if (!interview.skipNext) {
        await interview.next();
      }
    });

    test('Stage 0: Welcome', async ({ page, interview }) => {
      await interview.captureInitial();
      // Verify welcome stage content
      await expect(
        page.getByRole('heading', { name: 'Welcome!' }),
      ).toBeVisible();

      // Information stage - should be able to proceed immediately
      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 1: Getting Started', async ({ page, interview }) => {
      await interview.captureInitial();
      // Verify getting started stage content
      await expect(
        page.getByRole('heading', { name: 'Getting Started' }),
      ).toBeVisible();

      const video = page.locator('video');
      await expect(video).toBeVisible();

      // Information stage - should be able to proceed immediately
      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 2: Self-Nomination', async ({ interview, stage }) => {
      await interview.captureInitial();
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

      await interview.captureFinal();
    });

    test('Stage 3: Ego Information (EgoForm)', async ({
      page,
      interview,
      stage,
    }) => {
      await interview.captureInitial();
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

      await interview.captureFinal();
    });

    // Stages 4-5 are skipped (conditional on Female sex assigned at birth)

    test('Stage 6: Ego Information - Perceived by Others', async ({
      page,
      stage,
      interview,
    }) => {
      await interview.captureInitial();
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

      await interview.captureFinal();
    });

    test('Stage 7: Map Selection Information', async ({ page, interview }) => {
      await interview.captureInitial();
      await expect(
        page.getByRole('heading', { name: 'Map Selection' }),
      ).toBeVisible();

      const video = page.locator('video');
      await expect(video).toBeVisible();

      // Information stage - should be able to proceed immediately
      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
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

      await stage.geospatial.waitForGeoJsonRendered();
      await interview.captureInitial();

      // --- Verify prompt is visible ---
      await expect(stage.getPrompt()).toBeVisible();

      // --- Verify core UI elements are visible ---
      await expect(stage.geospatial.mapContainer).toBeVisible();
      await expect(stage.geospatial.toolbar).toBeVisible();

      // Verify the current node (Me) is displayed
      await expect(stage.geospatial.getNode('Me')).toBeVisible();

      // --- Wait for map to fully load with all layers ---
      await stage.geospatial.waitForMapIdle();

      // --- Test zoom controls ---
      await expect(stage.geospatial.zoomInButton).toBeVisible();
      await expect(stage.geospatial.zoomOutButton).toBeVisible();
      await expect(stage.geospatial.recenterButton).toBeVisible();

      // Click zoom controls
      await stage.geospatial.zoomIn();
      await stage.geospatial.zoomOut();
      await stage.geospatial.recenter();
      await stage.geospatial.waitForMapIdle();

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

      // Wait for the map to settle after the search-triggered zoom/pan
      // so tile labels are fully rendered before any screenshot.
      await stage.geospatial.waitForMapIdle();

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

      await interview.captureFinal();
    });

    test('Stage 9: Ego Substances', async ({ page, stage, interview }) => {
      await interview.captureInitial();
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

      await interview.captureFinal();
    });

    test('Stage 10: Name Generator Instructions', async ({
      page,
      interview,
    }) => {
      await interview.captureInitial();
      // Verify the heading is visible
      await expect(
        page.getByRole('heading', { name: 'People in Your Life' }),
      ).toBeVisible();

      const video = page.locator('video');
      await expect(video).toBeVisible();

      // Information stage - should be able to proceed immediately
      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 11: Name Generator (Close Ties and Drug)', async ({
      page,
      interview,
      stage,
    }) => {
      await interview.captureInitial();
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
      await expect(stage.getPrompt(/marijuana|drugs/i)).toBeVisible();

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

      await interview.captureFinal();
    });

    test('Stage 12: Sex Partner Nomination', async ({
      page,
      interview,
      stage,
      protocol,
    }) => {
      await interview.captureInitial();
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

      // Wait for Evan to persist to Redux/DB before dragging. Without this,
      // dnd-kit's sortable index map can be stale when Ctrl+D fires, causing
      // ArrowRight to navigate to a wrong slot and Enter to drop Bob onto an
      // invalid target (rare Firefox race — see stage-12 snapshot flake).
      await protocol.waitForNode(interview.interviewId, 'Evan');

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

      await interview.captureFinal();
    });

    test('Stage 13: Sociogram (Close Ties and Drug Partners)', async ({
      interview,
      stage,
    }) => {
      await stage.sociogram.waitForSimulationSettled();

      await interview.captureInitial();
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

      await interview.captureFinal();
    });

    test('Stage 14: Sex Sociogram', async ({ interview, stage }) => {
      await stage.sociogram.waitForSimulationSettled();

      await interview.captureInitial();
      // Only sex partners should be visible (Bob and Evan)
      await expect(stage.sociogram.getNode('Bob')).toBeVisible();
      await expect(stage.sociogram.getNode('Evan')).toBeVisible();

      // No edges initially
      await expect.poll(() => stage.sociogram.getEdgeCount()).toBe(0);

      // Connect Bob and Evan
      await stage.sociogram.connectNodes('Bob', 'Evan');

      // Verify edge was created
      await expect.poll(() => stage.sociogram.getEdgeCount()).toBe(1);

      // --- Proceed to next prompt (serious relationship highlighting) ---
      await interview.nextButton.click();

      // Verify we're on the second prompt (serious relationship)
      await expect(stage.getPrompt(/serious relationship/i)).toBeVisible();

      // Highlight Bob as a serious relationship
      await stage.sociogram.toggleHighlight('Bob');

      await expect(stage.sociogram.getNode('Bob')).toHaveAttribute(
        'data-node-highlighted',
        'true',
      );

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 15: Ordinal Bins (Relationship Strength)', async ({
      page,
      interview,
      stage,
    }) => {
      await interview.captureInitial();
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

      await interview.captureFinal();
    });

    test('Stage 16: Categorical Bins (4 prompts)', async ({
      interview,
      stage,
    }) => {
      await interview.captureInitial();
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
      await expect(stage.getPrompt(/race|ethnic/i)).toBeVisible();

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
      await expect(stage.getPrompt(/sexual identity/i)).toBeVisible();

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

      await interview.captureFinal();
    });

    test('Stage 17: Lives in City', async ({ interview, stage }) => {
      await interview.captureInitial();
      // Verify prompt is visible
      await expect(stage.getPrompt()).toBeVisible();

      // Verify category bins
      await expect(
        stage.categoricalBin.getBin('Yes, lives in Chicago'),
      ).toBeVisible();
      await expect(
        stage.categoricalBin.getBin('No, does not live in Chicago'),
      ).toBeVisible();

      // Drag nodes to bins — Dan and Alice live in Chicago, Bob and Evan do not
      await stage.categoricalBin.dragNodeToBin('Dan', 'Yes, lives in Chicago');
      await stage.categoricalBin.dragNodeToBin(
        'Alice',
        'Yes, lives in Chicago',
      );
      await stage.categoricalBin.dragNodeToBin(
        'Bob',
        'No, does not live in Chicago',
      );
      await stage.categoricalBin.dragNodeToBin(
        'Evan',
        'No, does not live in Chicago',
      );

      // Verify counts
      expect(
        await stage.categoricalBin.getNodeCountInBin('Yes, lives in Chicago'),
      ).toBe(2);
      expect(
        await stage.categoricalBin.getNodeCountInBin(
          'No, does not live in Chicago',
        ),
      ).toBe(2);

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 18: Alter Census Tract - Introduction', async ({
      page,
      interview,
    }) => {
      await interview.captureInitial();
      await expect(
        page.getByRole('heading', { name: 'Map Selection' }),
      ).toBeVisible();

      const video = page.locator('video');
      await expect(video).toBeVisible();

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 19: Alter Census Tract (Geospatial)', async ({
      interview,
      stage,
      browserName,
    }) => {
      test.skip(
        browserName === 'firefox',
        'Firefox lacks WebGL support in Playwright',
      );

      await stage.geospatial.waitForGeoJsonRendered();
      await interview.captureInitial();

      // This geospatial stage iterates over nodes that live in Chicago (Dan, Alice)

      // --- Node 1 (first Chicago alter) ---
      await expect(stage.getPrompt()).toBeVisible();
      await expect(stage.geospatial.mapContainer).toBeVisible();
      await stage.geospatial.waitForMapIdle();
      await stage.geospatial.clickOnMap(0.5, 0.5);
      await expect
        .poll(() => interview.nextButtonHasPulse(), { timeout: 5000 })
        .toBe(true);

      // Click next — beforeNext advances to node 2 (stays in stage)
      await interview.nextButton.click();

      // --- Node 2 (second Chicago alter) ---
      await expect(stage.geospatial.mapContainer).toBeVisible();
      await stage.geospatial.waitForMapIdle();
      await stage.geospatial.clickOnMap(0.5, 0.5);
      await expect
        .poll(() => interview.nextButtonHasPulse(), { timeout: 5000 })
        .toBe(true);

      // Click next — last node, exits stage
      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 20: Sex Partners and Activity - Introduction', async ({
      page,
      interview,
    }) => {
      await interview.captureInitial();
      await expect(
        page.getByRole('heading', {
          name: 'Your Sexual Partners and Activity',
        }),
      ).toBeVisible();

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 21: Ego PrEP', async ({ page, stage, interview }) => {
      await interview.captureInitial();
      // Verify the form heading
      await expect(
        page.getByRole('heading', { name: 'PrEP Use', level: 1 }),
      ).toBeVisible();

      // PrEP use (RadioGroup)
      await stage.form.selectRadio(
        '3736e8f1-af8c-4594-a1a1-d9a413e7a137',
        'No',
      );

      await interview.captureFinal();
    });

    // Stage 22 (Ego ART) is skipped — only shown when HIV status = HIV Positive

    test('Stage 23: Anal Sex Categorical Check', async ({
      interview,
      stage,
    }) => {
      await interview.captureInitial();
      // Assert that this is actually step 23 (skip logic worked)
      await expect(interview.page).toHaveURL(/step=23/);

      // This stage only shows sex partners (Bob, Evan)
      await expect(stage.getPrompt()).toBeVisible();

      // Verify bins
      await expect(stage.categoricalBin.getBin('Anal sex')).toBeVisible();
      await expect(stage.categoricalBin.getBin('No anal sex')).toBeVisible();

      // Categorize both sex partners as having had anal sex
      await stage.categoricalBin.dragNodeToBin('Bob', 'Anal sex');
      await stage.categoricalBin.dragNodeToBin('Evan', 'Anal sex');

      expect(await stage.categoricalBin.getNodeCountInBin('Anal sex')).toBe(2);

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 24: Anal Sex Counts (AlterForm)', async ({
      interview,
      stage,
    }) => {
      await interview.captureInitial();
      // AlterForm with intro panel — dismiss it
      await interview.nextButton.click();

      // Slide 1 (first sex partner with anal sex — Bob or Evan)
      // 1. Number of times anal sex (Number)
      await stage.form.fillNumber('a61f8d2d-f3d1-4c4d-9236-34e709effb9f', '5');

      // 2. Number of times without condom (Number — lessThanVariable validation)
      await stage.form.fillNumber('315d540c-92fe-4acd-81c7-0b6ea2dacc17', '2');

      // Advance to next slide
      await interview.nextButton.click();

      // Slide 2 (second sex partner with anal sex)
      await stage.form.fillNumber('a61f8d2d-f3d1-4c4d-9236-34e709effb9f', '3');
      await stage.form.fillNumber('315d540c-92fe-4acd-81c7-0b6ea2dacc17', '1');

      await interview.captureFinal();
    });

    test('Stage 25: Sex Partner Form (AlterForm)', async ({
      interview,
      stage,
    }) => {
      await interview.captureInitial();
      // Dismiss intro panel
      await interview.nextButton.click();

      // Slide 1 (first sex partner with anal sex)
      // 1. First day of sex (RelativeDatePicker)
      await stage.form.fillDate(
        'c2235691-c828-4138-8602-37d3f047af48',
        '2025-06-15',
      );

      // 2. Last day of sex (RelativeDatePicker)
      await stage.form.fillDate(
        '5442154c-b098-4801-ad84-80e7e55d7685',
        '2025-12-15',
      );

      // 3. Ongoing partner (Boolean)
      await stage.form.selectRadio(
        'ce4f028f-31ea-46a9-8564-a7c276d8efed',
        'Yes',
      );

      // 4. HIV status — set first partner HIV Negative (RadioGroup)
      await stage.form.selectRadio(
        '33e444a9-1605-492d-8c49-216eb08b078a',
        'HIV Negative',
      );

      // Advance to next slide
      await interview.nextButton.click();

      // Slide 2 (second sex partner with anal sex)
      await stage.form.fillDate(
        'c2235691-c828-4138-8602-37d3f047af48',
        '2025-09-01',
      );
      await stage.form.fillDate(
        '5442154c-b098-4801-ad84-80e7e55d7685',
        '2025-11-30',
      );
      await stage.form.selectRadio(
        'ce4f028f-31ea-46a9-8564-a7c276d8efed',
        'No',
      );

      // Set second partner HIV Positive (enables Alter ART stage)
      await stage.form.selectRadio(
        '33e444a9-1605-492d-8c49-216eb08b078a',
        'HIV Positive',
      );

      await interview.captureFinal();
    });

    test('Stage 26: Alter PrEP (CategoricalBin)', async ({
      interview,
      stage,
    }) => {
      await interview.captureInitial();
      // Only shows partners whose HIV status is NOT HIV Positive
      // (i.e., the partner we set to HIV Negative)
      await expect(stage.getPrompt()).toBeVisible();

      // Verify bins
      await expect(stage.categoricalBin.getBin('Yes')).toBeVisible();
      await expect(stage.categoricalBin.getBin('No')).toBeVisible();

      // Get unplaced count — should be 1 (only the HIV Negative partner)
      const unplaced = await stage.categoricalBin.getUnplacedCount();
      expect(unplaced).toBeGreaterThanOrEqual(1);

      // Categorize the partner
      const drawerToggle = stage.categoricalBin.drawerToggle;
      await expect(drawerToggle).toBeVisible();

      // Drag the node to "Yes" bin
      // The node name depends on which partner was HIV Negative (first in slide order)
      // Use the first unplaced node from the drawer
      const firstNode = stage.page
        .getByRole('button', { name: /Bob|Evan/ })
        .first();
      const nodeName = await firstNode.textContent();
      if (nodeName) {
        await stage.categoricalBin.dragNodeToBin(nodeName.trim(), 'Yes');
      }

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 27: Alter ART (CategoricalBin)', async ({
      interview,
      stage,
    }) => {
      await interview.captureInitial();
      await expect(interview.page).toHaveURL(/step=27/);
      // Only shows partners whose HIV status IS HIV Positive
      await expect(stage.getPrompt()).toBeVisible();

      await expect(stage.categoricalBin.getBin('Yes')).toBeVisible();
      await expect(stage.categoricalBin.getBin('No')).toBeVisible();

      const unplaced = await stage.categoricalBin.getUnplacedCount();
      expect(unplaced).toBeGreaterThanOrEqual(1);

      // Drag the HIV Positive partner to "Yes"
      const firstNode = stage.page
        .getByRole('button', { name: /Bob|Evan/ })
        .first();
      const nodeName = await firstNode.textContent();
      if (nodeName) {
        await stage.categoricalBin.dragNodeToBin(nodeName.trim(), 'Yes');
      }

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 28: Alter Substances (AlterForm)', async ({
      interview,
      stage,
    }) => {
      await interview.captureInitial();
      // Dismiss intro panel
      await interview.nextButton.click();

      // Slide 1 — select substances for first anal sex partner (CheckboxGroup)
      await stage.form.selectCheckbox(
        'd76f1663-f491-4aa2-90ee-806e186652b0',
        'Marijuana',
      );

      // Advance to next slide
      await interview.nextButton.click();

      // Slide 2 — select substances for second anal sex partner
      await stage.form.selectCheckbox(
        'd76f1663-f491-4aa2-90ee-806e186652b0',
        'None',
      );

      await interview.captureFinal();
    });

    test('Stage 29: Sex Partner Place Met (CategoricalBin)', async ({
      interview,
      stage,
    }) => {
      await interview.captureInitial();
      // Shows anal sex partners — categorize where they were met
      await expect(stage.getPrompt()).toBeVisible();

      // Verify bins (ToggleButtonGroup-style categories)
      await expect(
        stage.categoricalBin.getBin('Online / Mobile App'),
      ).toBeVisible();
      await expect(
        stage.categoricalBin.getBin('Physical place or venue'),
      ).toBeVisible();

      // Get the two partners and categorize them
      const unplaced = await stage.categoricalBin.getUnplacedCount();
      expect(unplaced).toBe(2);

      // Get the first unplaced node and drag to Physical Place
      const firstNode = stage.page
        .getByRole('button', { name: /Bob|Evan/ })
        .first();
      const firstName = (await firstNode.textContent())?.trim() ?? '';
      await stage.categoricalBin.dragNodeToBin(
        firstName,
        'Physical place or venue',
      );

      // Get the second unplaced node and drag to Online / Mobile App
      const secondNode = stage.page
        .getByRole('button', { name: /Bob|Evan/ })
        .first();
      const secondName = (await secondNode.textContent())?.trim() ?? '';
      await stage.categoricalBin.dragNodeToBin(
        secondName,
        'Online / Mobile App',
      );

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 30: Name Place Met (AlterForm)', async ({
      interview,
      stage,
    }) => {
      await interview.captureInitial();
      // Only shows partners who met at a physical place
      // Dismiss intro panel
      await interview.nextButton.click();

      // Fill the venue name (Text)
      await stage.form.fillText(
        '052fbe4e-a85e-4dc8-b632-43d3f9462ec2',
        'The Bar',
      );

      await interview.captureFinal();
    });

    test('Stage 31: Name App Met (AlterForm)', async ({ interview, stage }) => {
      await interview.captureInitial();
      // Only shows partners who met online
      // Dismiss intro panel
      await interview.nextButton.click();

      // Fill the app name (Text)
      await stage.form.fillText(
        'b5cd7347-5dce-4a67-8f2b-11dd2b6ead0b',
        'Grindr',
      );

      await interview.captureFinal();
    });

    // Stages 32-33 (Poppers and Methamphetamine) are skipped
    // — conditional on ego Poppers=Yes and Meth=Yes respectively (both set to No in Stage 9)

    test('Stage 34: Venue Nomination Instructions', async ({
      page,
      interview,
    }) => {
      await interview.captureInitial();
      await expect(
        page.getByRole('heading', { name: 'Places You Go' }),
      ).toBeVisible();

      const video = page.locator('video');
      await expect(video).toBeVisible();

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 35: Venue Nomination - Socialize', async ({
      interview,
      stage,
    }) => {
      await interview.captureInitial();
      await expect(stage.getPrompt()).toBeVisible();

      // Add 3 venues
      await stage.quickAdd.addNode('The Bar');
      await expect(stage.getNode('The Bar')).toBeVisible();

      await stage.quickAdd.addNode('Boystown');
      await expect(stage.getNode('Boystown')).toBeVisible();

      await stage.quickAdd.addNode('Lakeshore');
      await expect(stage.getNode('Lakeshore')).toBeVisible();

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 36: Venue Nomination - Meet People', async ({
      interview,
      stage,
    }) => {
      await interview.captureInitial();
      await expect(stage.getPrompt()).toBeVisible();

      // Side panel should show previously added venues
      await expect(stage.nodePanel.panel).toBeVisible();
      await expect(stage.nodePanel.getNode('The Bar')).toBeVisible();

      // Add a new venue
      await stage.quickAdd.addNode('Club X');
      await expect(stage.getNode('Club X')).toBeVisible();

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 37: Venue Frequency (OrdinalBin)', async ({
      interview,
      stage,
    }) => {
      await interview.captureInitial();
      await expect(stage.getPrompt()).toBeVisible();

      // Verify bins match codebook options for venue_freq
      await expect(
        stage.page.getByRole('heading', {
          name: 'Daily',
          level: 4,
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        stage.page.getByRole('heading', {
          name: 'Weekly',
          level: 4,
          exact: true,
        }),
      ).toBeVisible();

      // Should have 4 venue nodes unplaced
      const unplaced = await stage.ordinalBin.getUnplacedCount();
      expect(unplaced).toBe(4);

      // Place venues into bins (round-robin)
      await stage.ordinalBin.dragNodeToBin('The Bar', 'Weekly');
      await stage.ordinalBin.dragNodeToBin('Boystown', 'Monthly');
      await stage.ordinalBin.dragNodeToBin('Lakeshore', 'Daily');
      await stage.ordinalBin.dragNodeToBin('Club X', 'Less Than Monthly');

      // Verify all placed
      expect(await stage.ordinalBin.getUnplacedCount()).toBe(0);

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 38: Venue Type (CategoricalBin)', async ({
      interview,
      stage,
    }) => {
      await interview.captureInitial();
      await expect(stage.getPrompt()).toBeVisible();

      // Verify bins
      await expect(stage.categoricalBin.getBin('Bar/Club')).toBeVisible();
      await expect(
        stage.categoricalBin.getBin('Restaurant/Coffee Shop'),
      ).toBeVisible();

      // Categorize venues
      await stage.categoricalBin.dragNodeToBin('The Bar', 'Bar/Club');
      await stage.categoricalBin.dragNodeToBin(
        'Boystown',
        'Restaurant/Coffee Shop',
      );
      await stage.categoricalBin.dragNodeToBin(
        'Lakeshore',
        'Park/Neighborhood',
      );
      await stage.categoricalBin.dragNodeToBin('Club X', 'Bar/Club');

      expect(await stage.categoricalBin.getNodeCountInBin('Bar/Club')).toBe(2);

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 39: Venue Census Tract - Introduction', async ({
      page,
      interview,
    }) => {
      await interview.captureInitial();
      await expect(
        page.getByRole('heading', { name: 'Map Selection' }),
      ).toBeVisible();

      const video = page.locator('video');
      await expect(video).toBeVisible();

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 40: Venue Census Tract (Geospatial)', async ({
      interview,
      stage,
      browserName,
    }) => {
      test.skip(
        browserName === 'firefox',
        'Firefox lacks WebGL support in Playwright',
      );

      await stage.geospatial.waitForGeoJsonRendered();
      await interview.captureInitial();

      // 4 venues: The Bar, Boystown, Lakeshore, Club X
      for (let i = 0; i < 4; i++) {
        await expect(stage.getPrompt()).toBeVisible();
        await expect(stage.geospatial.mapContainer).toBeVisible();
        await stage.geospatial.waitForMapIdle();
        await stage.geospatial.clickOnMap(0.5, 0.5);
        await expect
          .poll(() => interview.nextButtonHasPulse(), { timeout: 5000 })
          .toBe(true);

        if (i < 3) {
          // Advance to next node (stays in stage)
          await interview.nextButton.click();
        }
      }

      // Exit stage on last node
      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 41: Venue Attributes (Sociogram - LGBTQ highlighting)', async ({
      interview,
      stage,
    }) => {
      await stage.sociogram.waitForSimulationSettled();

      await interview.captureInitial();
      // Verify venue nodes are visible on canvas
      await expect(stage.sociogram.getNode('The Bar')).toBeVisible();
      await expect(stage.sociogram.getNode('Boystown')).toBeVisible();
      await expect(stage.sociogram.getNode('Lakeshore')).toBeVisible();
      await expect(stage.sociogram.getNode('Club X')).toBeVisible();

      // Highlight LGBTQ venues
      await stage.sociogram.toggleHighlight('The Bar');
      await expect(stage.sociogram.getNode('The Bar')).toHaveAttribute(
        'data-node-highlighted',
        'true',
      );

      await stage.sociogram.toggleHighlight('Club X');
      await expect(stage.sociogram.getNode('Club X')).toHaveAttribute(
        'data-node-highlighted',
        'true',
      );

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 42: Venue - Heavy Drinking (OrdinalBin)', async ({
      interview,
      stage,
    }) => {
      await interview.captureInitial();
      await expect(stage.getPrompt()).toBeVisible();

      // Verify bins match venue_heavy_drinking options
      await expect(
        stage.page.getByRole('heading', {
          name: 'Very Common',
          level: 4,
          exact: true,
        }),
      ).toBeVisible();

      // Place all venues
      await stage.ordinalBin.dragNodeToBin('The Bar', 'Very Common');
      await stage.ordinalBin.dragNodeToBin('Boystown', 'Somewhat Common');
      await stage.ordinalBin.dragNodeToBin('Lakeshore', 'Not At All Common');
      await stage.ordinalBin.dragNodeToBin('Club X', 'Very Common');

      expect(await stage.ordinalBin.getUnplacedCount()).toBe(0);

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 43: Venue - Substance Use (OrdinalBin)', async ({
      interview,
      stage,
    }) => {
      await interview.captureInitial();
      await expect(stage.getPrompt()).toBeVisible();

      await stage.ordinalBin.dragNodeToBin('The Bar', 'Very Common');
      await stage.ordinalBin.dragNodeToBin('Boystown', 'Not At All Common');
      await stage.ordinalBin.dragNodeToBin('Lakeshore', 'Not At All Common');
      await stage.ordinalBin.dragNodeToBin('Club X', 'Somewhat Common');

      expect(await stage.ordinalBin.getUnplacedCount()).toBe(0);

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 44: Venue - Meet for Sex (OrdinalBin)', async ({
      interview,
      stage,
    }) => {
      await interview.captureInitial();
      await expect(stage.getPrompt()).toBeVisible();

      await stage.ordinalBin.dragNodeToBin('The Bar', 'Somewhat Common');
      await stage.ordinalBin.dragNodeToBin('Boystown', 'Not At All Common');
      await stage.ordinalBin.dragNodeToBin('Lakeshore', 'Not At All Common');
      await stage.ordinalBin.dragNodeToBin('Club X', 'Very Common');

      expect(await stage.ordinalBin.getUnplacedCount()).toBe(0);

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 45: App Instructions', async ({ page, interview }) => {
      await interview.captureInitial();
      await expect(
        page.getByRole('heading', { name: 'Apps and Websites You Use' }),
      ).toBeVisible();

      const video = page.locator('video');
      await expect(video).toBeVisible();

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 46: App Nomination', async ({ interview, stage }) => {
      await interview.captureInitial();
      await expect(stage.getPrompt()).toBeVisible();

      // Add apps
      await stage.quickAdd.addNode('Grindr');
      await expect(stage.getNode('Grindr')).toBeVisible();

      await stage.quickAdd.addNode('Scruff');
      await expect(stage.getNode('Scruff')).toBeVisible();

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 47: Healthcare Access (EgoForm)', async ({
      page,
      interview,
      stage,
    }) => {
      await interview.captureInitial();
      await expect(
        page.getByRole('heading', { name: 'Healthcare Access', level: 1 }),
      ).toBeVisible();

      // Select Yes — enables healthcare nomination stage
      await stage.form.selectRadio(
        '606361d0-6c1d-4763-b3f0-e8c122a08a68',
        'Yes',
      );

      await interview.captureFinal();
    });

    test('Stage 48: Healthcare Nomination', async ({ interview, stage }) => {
      await interview.captureInitial();
      await expect(stage.getPrompt()).toBeVisible();

      // Add a healthcare provider
      await stage.quickAdd.addNode('Howard Brown');
      await expect(stage.getNode('Howard Brown')).toBeVisible();

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 49: Healthcare Census Tract - Information', async ({
      page,
      interview,
    }) => {
      await interview.captureInitial();
      await expect(
        page.getByRole('heading', { name: 'Healthcare Access' }),
      ).toBeVisible();

      const video = page.locator('video');
      await expect(video).toBeVisible();

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 50: Healthcare Census Tract (Geospatial)', async ({
      interview,
      stage,
      browserName,
    }) => {
      test.skip(
        browserName === 'firefox',
        'Firefox lacks WebGL support in Playwright',
      );

      await stage.geospatial.waitForGeoJsonRendered();
      await interview.captureInitial();

      await expect(stage.getPrompt()).toBeVisible();
      await expect(stage.geospatial.mapContainer).toBeVisible();

      await stage.geospatial.waitForMapIdle();

      // Click on map to select area for the healthcare provider
      await stage.geospatial.clickOnMap(0.5, 0.5);

      await expect
        .poll(() => interview.nextButtonHasPulse(), { timeout: 5000 })
        .toBe(true);

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 51: Social Support - Introduction', async ({
      page,
      interview,
    }) => {
      await interview.captureInitial();
      await expect(
        page.getByRole('heading', {
          name: 'Your Thoughts and Feelings',
        }),
      ).toBeVisible();

      await expect(interview.nextButton).toBeEnabled();

      await interview.captureFinal();
    });

    test('Stage 52: Ego Social Support (EgoForm)', async ({
      page,
      interview,
      stage,
    }) => {
      await interview.captureInitial();
      await expect(
        page.getByRole('heading', { name: 'About You', level: 1 }),
      ).toBeVisible();

      // Verify validation blocks advancement (all 12 fields are required)
      await interview.nextButton.click();
      await expectURL(page, /step=52/);

      // Verify at least one field error is visible
      await expect(
        stage.form.getFieldError('7c2c9953-1d3a-498f-a83d-11b6378213f4'),
      ).toBeVisible();

      // Fill all 12 LikertScale fields (all required)
      // 1. PersonInNeed
      await stage.form.selectLikert(
        '7c2c9953-1d3a-498f-a83d-11b6378213f4',
        'Agree',
      );

      // 2. ShareJoySorrow
      await stage.form.selectLikert(
        'c08cb514-c349-4402-a2fb-49e6b238ea06',
        'Agree',
      );

      // 3. FamilyHelp
      await stage.form.selectLikert(
        '4c7f3cf9-bf6a-4c88-85bd-c2232e4ecfdb',
        'Neutral',
      );

      // 4. SourceComfort
      await stage.form.selectLikert(
        'd053c8dc-827e-4fa1-8e5f-b2124ac98f64',
        'Agree',
      );

      // 5. CountOnFriends
      await stage.form.selectLikert(
        '6c7d34c3-ef7e-4fcc-9ff3-4ed299a2ad98',
        'Strongly Agree',
      );

      // 6. TalkProblemsFamily
      await stage.form.selectLikert(
        'f78cfe68-479d-40b7-81c2-f58a548053e1',
        'Disagree',
      );

      // 7. FriendsJoySorrow
      await stage.form.selectLikert(
        '7ce13844-b620-4ce6-9baa-714ec97d23a4',
        'Agree',
      );

      // 8. CareFeelings
      await stage.form.selectLikert(
        'f94a1de6-abbd-48d9-a759-02885718ed71',
        'Agree',
      );

      // 9. FamilyHelpDecisions
      await stage.form.selectLikert(
        '74ab8125-dade-4b1e-bd3f-63faca51e357',
        'Neutral',
      );

      // 10. TalkProblemsFriends
      await stage.form.selectLikert(
        'f29caf3b-f90f-48f6-b9a0-6a544f86e5b7',
        'Agree',
      );

      // 11. EmotionalSupport
      await stage.form.selectLikert(
        '677b1fe2-a15d-4828-bef7-2f0e5fc79b3a',
        'Neutral',
      );

      // 12. FriendsTryHelp
      await stage.form.selectLikert(
        '0452300a-e807-40a4-9bc5-586bf671d52d',
        'Strongly Agree',
      );

      await interview.captureFinal();
    });

    test('Stage 53: Finish Interview', async ({ interview, prisma }) => {
      await interview.captureInitial();
      interview.skipNext = true;
      await interview.finishInterview();

      // Verify interview has finishTime set
      const finishedInterview = await prisma.interview.findUnique({
        where: { id: interviewId },
      });
      expect(finishedInterview?.finishTime).not.toBeNull();
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
    let navigatedToStart = false;

    test.beforeAll(async ({ protocol }) => {
      interviewId = await protocol.createInterview(sharedProtocolId);
      navigatedToStart = false;
    });

    test.beforeEach(async ({ interview }) => {
      interview.interviewId = interviewId;
      interview.snapshotPrefix = 'female-ineligibility';
      if (!navigatedToStart) {
        await interview.goto(0);
        navigatedToStart = true;
      }
    });

    test.afterEach(async ({ interview }) => {
      if (!interview.skipNext) {
        await interview.next();
      }
    });

    test('Stage 0: Welcome', async ({ page, interview }) => {
      await interview.captureInitial();
      await expect(
        page.getByRole('heading', { name: 'Welcome!' }),
      ).toBeVisible();
      await expect(interview.nextButton).toBeEnabled();
    });

    test('Stage 1: Getting Started', async ({ page, interview }) => {
      await interview.captureInitial();
      await expect(
        page.getByRole('heading', { name: 'Getting Started' }),
      ).toBeVisible();

      const video = page.locator('video');
      await expect(video).toBeVisible();

      await expect(interview.nextButton).toBeEnabled();
    });

    test('Stage 2: Self-Nomination', async ({ interview, stage }) => {
      await interview.captureInitial();
      // Add the ego node
      await stage.quickAdd.addNode('Me');
      await expect(stage.getNode('Me')).toBeVisible();

      // Validation released
      expect(await interview.nextButtonHasPulse()).toBe(true);
    });

    test('Stage 3: Ego Form - Select Female at Birth', async ({
      page,
      interview,
      stage,
    }) => {
      await interview.captureInitial();
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
    });

    test('Stage 4: Sex Assigned at Birth Confirmation', async ({
      page,
      interview,
      stage,
    }) => {
      await interview.captureInitial();
      await expect(
        page.getByRole('heading', { name: 'Your Sex Assigned at Birth' }),
      ).toBeVisible();

      // Confirm "Yes" - use field UUID for sex confirmation
      await stage.form.selectRadio(
        'f249c2d1-3f54-49a9-83d8-81e2387df5e5',
        'Yes',
      );
    });

    test('Stage 5: Ineligibility Notice and Finish Interview', async ({
      page,
      interview,
    }) => {
      await interview.captureInitial();
      await expect(
        page.getByRole('heading', { name: 'Study Ineligibility' }),
      ).toBeVisible();

      await expect(interview.nextButton).toBeEnabled();
    });

    test('Stage 53: Finish Interview', async ({ interview, prisma }) => {
      await interview.captureInitial();
      // Assert that we skipped to stage 53
      await expect(interview.page).toHaveURL(/step=53/);

      interview.skipNext = true;
      await interview.finishInterview();
      // Verify interview has finishTime set
      const finishedInterview = await prisma.interview.findUnique({
        where: { id: interviewId },
      });
      expect(finishedInterview?.finishTime).not.toBeNull();
    });
  }); // End of Female Ineligibility Path describe
});
