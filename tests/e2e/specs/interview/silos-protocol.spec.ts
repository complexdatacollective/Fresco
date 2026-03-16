/**
 * SILOS Protocol Tests
 *
 * Tests interview stage navigation using a real .netcanvas protocol file.
 */

import path from 'node:path';
import { expect, test } from '~/tests/e2e/fixtures/interview-test.js';

const SILOS_PROTOCOL_PATH = path.resolve(
  import.meta.dirname,
  '../../data/silos.netcanvas',
);

test.describe('SILOS Protocol', () => {
  test.describe.configure({ mode: 'serial' });

  let interviewId: string;

  test.beforeAll(async ({ database, protocol }) => {
    await database.restoreSnapshot();
    const { protocolId } = await protocol.install(SILOS_PROTOCOL_PATH);
    interviewId = await protocol.createInterview(protocolId);
  });

  test.beforeEach(({ interview }) => {
    interview.interviewId = interviewId;
  });

  // Capture end state after each test
  test.afterEach(async ({ page, interview }) => {
    const stepMatch = /step=(\d+)/.exec(page.url());
    if (stepMatch) {
      const step = stepMatch[1];
      await interview.capture(`stage-${step}-final`);
    }
  });

  test('Stage 0: Welcome', async ({ page, interview }) => {
    await interview.goto(0);

    // Verify welcome stage content
    await expect(page.getByRole('heading', { name: 'Welcome!' })).toBeVisible();

    // Information stage - should be able to proceed immediately
    await expect(interview.nextButton).toBeEnabled();
  });

  test('Stage 2: Self-Nomination', async ({ interview, stage }) => {
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

  test('Stage 11: Name Generator (Close Ties and Drug)', async ({
    page,
    interview,
    stage,
  }) => {
    await interview.goto(11);

    // Verify the prompt is visible (heading level 2)
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();

    // Open the add form
    await stage.nameGenerator.openAddForm();

    // Verify dialog is open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill form fields using UUIDs from protocol
    // 1. Name (Text input)
    await stage.form.fillText('b1eb909a-13cd-4dc6-ab90-c77e7bc2c5d3', 'Alice');

    // 2. Age (Number input)
    await stage.form.fillNumber('6621dc88-9cde-43a1-85ec-6fc7689b2211', '25');

    // 3. Relationship (ToggleButtonGroup)
    await stage.form.selectToggleButton(
      '8f5d456b-06fb-4958-9a92-da6e87008bce',
      'Friend',
    );

    // Submit the form
    await stage.nameGenerator.submitForm();

    // Verify node was added
    await expect(stage.getNode('Alice')).toBeVisible();

    // Validation released - pulse animation visible
    expect(await interview.nextButtonHasPulse()).toBe(true);

    // Add a second node (friend)
    await stage.nameGenerator.openAddForm();
    await stage.form.fillText('b1eb909a-13cd-4dc6-ab90-c77e7bc2c5d3', 'Bob');
    await stage.form.fillNumber('6621dc88-9cde-43a1-85ec-6fc7689b2211', '30');
    await stage.form.selectToggleButton(
      '8f5d456b-06fb-4958-9a92-da6e87008bce',
      'Friend',
    );
    await stage.nameGenerator.submitForm();
    await expect(stage.getNode('Bob')).toBeVisible();

    // Add a third node (friend)
    await stage.nameGenerator.openAddForm();
    await stage.form.fillText(
      'b1eb909a-13cd-4dc6-ab90-c77e7bc2c5d3',
      'Charlie',
    );
    await stage.form.fillNumber('6621dc88-9cde-43a1-85ec-6fc7689b2211', '28');
    await stage.form.selectToggleButton(
      '8f5d456b-06fb-4958-9a92-da6e87008bce',
      'Friend',
    );
    await stage.nameGenerator.submitForm();
    await expect(stage.getNode('Charlie')).toBeVisible();

    await expect(interview.nextButton).toBeEnabled();
  });
});
