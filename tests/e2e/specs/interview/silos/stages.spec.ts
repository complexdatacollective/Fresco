import { expect, silosTest as test } from '../../../fixtures/silos-stage.js';
import {
  EGO_FORM_DATA,
  EGO_PERCEIVED_DATA,
  EGO_SUBSTANCES_DATA,
  EGO_VARIABLES,
} from '../../../fixtures/silos-test-data.js';

/**
 * SILOS Stages AMAB Happy Path Test
 *
 * The step parameter follows the user's visible progression, accounting
 * for skip logic (male path skips female confirmation stages).
 */
test.describe('SILOS Stages Happy Path', () => {
  test.describe.configure({ mode: 'serial' });

  test('Stage 0: Welcome', async ({ stage }) => {
    await stage.page.goto(`/interview/${stage.interview.id}?step=0`);
    await expect(stage.interview.nextButton).toBeVisible({ timeout: 15_000 });

    await stage.captureStart();

    // Verify welcome stage content
    await expect(
      stage.page.getByRole('heading', { name: 'Welcome!' }),
    ).toBeVisible();

    // Verify this is an Information stage (read-only, no form)
    await expect(stage.interview.nextButton).toBeEnabled();

    await stage.captureComplete();
  });

  test('Stage 1: Self-Nomination Instructions', async ({ stage }) => {
    await stage.page.goto(`/interview/${stage.interview.id}?step=1`);
    await expect(stage.interview.nextButton).toBeVisible({ timeout: 15_000 });

    await stage.captureStart();

    // Verify instructions stage content
    await expect(
      stage.page.getByRole('heading', { name: 'Getting Started' }),
    ).toBeVisible();

    // Information stage - should be able to proceed immediately
    await expect(stage.interview.nextButton).toBeEnabled();

    await stage.captureComplete();
  });

  test('Stage 2: Self-Nomination', async ({ stage }) => {
    await stage.page.goto(`/interview/${stage.interview.id}?step=2`);
    await expect(stage.interview.nextButton).toBeVisible({ timeout: 15_000 });

    await stage.captureStart();

    // This is a NameGeneratorQuickAdd stage
    // Verify the prompt is visible
    await expect(stage.interview.getStageContainer()).toBeVisible();

    // Add the ego node using quick add
    await stage.interview.quickAddNode('Me');

    // Verify a node was added (node appears with role="option")
    await expect(stage.page.getByRole('option', { name: 'Me' })).toBeVisible();

    // Should now be able to proceed (minNodes: 1 requirement met)
    await expect(stage.interview.nextButton).toBeEnabled();

    await stage.captureComplete();
  });

  test('Stage 3: Ego Information', async ({ stage }) => {
    await stage.page.goto(`/interview/${stage.interview.id}?step=3`);
    await expect(stage.interview.nextButton).toBeVisible({ timeout: 15_000 });

    await stage.captureStart();

    // This is an EgoForm stage - fill out demographics
    // Verify the form is visible
    await expect(
      stage.page.getByRole('heading', { name: 'About You' }),
    ).toBeVisible();

    // Fill date of birth
    await stage.interview.fillFormField(
      EGO_VARIABLES.dateOfBirth,
      EGO_FORM_DATA.dateOfBirth,
    );

    // Select sexual identity
    await stage.interview.fillFormField(
      EGO_VARIABLES.sexualIdentity,
      EGO_FORM_DATA.sexualIdentity,
    );

    // Select sex assigned at birth - CRITICAL: Must be Male
    await stage.interview.fillFormField(
      EGO_VARIABLES.sexAssignedAtBirth,
      EGO_FORM_DATA.sexAssignedAtBirth,
    );

    // Select gender
    await stage.interview.fillFormField(
      EGO_VARIABLES.gender,
      EGO_FORM_DATA.gender,
    );

    // Select race (can be multiple, but we'll select one)
    for (const race of EGO_FORM_DATA.race) {
      await stage.interview.fillFormField(EGO_VARIABLES.race, race);
    }

    // Select Hispanic/Latino
    await stage.interview.fillFormField(
      EGO_VARIABLES.hispanic,
      EGO_FORM_DATA.hispanic,
    );

    // Fill years lived in Chicagoland
    await stage.interview.fillFormField(
      EGO_VARIABLES.yearsLived,
      EGO_FORM_DATA.yearsLived,
    );

    // Select HIV status
    await stage.interview.fillFormField(
      EGO_VARIABLES.hivStatus,
      EGO_FORM_DATA.hivStatus,
    );

    // Should now be able to proceed
    await expect(stage.interview.nextButton).toBeEnabled();

    await stage.captureComplete();
  });

  test.skip('Stage 4: Perceived by Others', async ({ stage }) => {
    // On male path, protocol indices 4-5 (Female confirmation) are skipped.
    // step=4 should show protocol index 6: "Ego Information (Perceived by Others)"
    await stage.page.goto(`/interview/${stage.interview.id}?step=4`);
    await expect(stage.interview.nextButton).toBeVisible({ timeout: 15_000 });

    await stage.captureStart();

    // Verify we're on the Perceived by Others stage (not Female confirmation)
    // Check for the specific intro text about "how others see you"
    await expect(stage.page.getByText('how others see you')).toBeVisible({
      timeout: 5000,
    });

    // Fill perceived race
    await stage.interview.fillFormField(
      EGO_VARIABLES.perceivedRace,
      EGO_PERCEIVED_DATA.perceivedRace,
    );

    // Fill perceived Hispanic/Latino
    await stage.interview.fillFormField(
      EGO_VARIABLES.perceivedHispanic,
      EGO_PERCEIVED_DATA.perceivedHispanic,
    );

    // Fill perceived gender
    await stage.interview.fillFormField(
      EGO_VARIABLES.perceivedGender,
      EGO_PERCEIVED_DATA.perceivedGender,
    );

    // Fill perceived sexual identity
    await stage.interview.fillFormField(
      EGO_VARIABLES.perceivedSexualIdentity,
      EGO_PERCEIVED_DATA.perceivedSexualIdentity,
    );

    // Should now be able to proceed
    await expect(stage.interview.nextButton).toBeEnabled();

    await stage.captureComplete();
  });

  test.skip('Stage 5: Ego Census Tract Introduction', async ({ stage }) => {
    await stage.page.goto(`/interview/${stage.interview.id}?step=5`);
    await expect(stage.interview.nextButton).toBeVisible({ timeout: 15_000 });

    await stage.captureStart();

    // This is an Information stage about map selection
    await expect(
      stage.page.getByRole('heading', { name: 'Map Selection' }),
    ).toBeVisible();

    // Information stage - should be able to proceed immediately
    await expect(stage.interview.nextButton).toBeEnabled();

    await stage.captureComplete();
  });

  // TODO: Stage 6 (Ego Census Tract) is a Geospatial stage that requires Mapbox API key access.
  // Using outside selectable areas now until we figure out API key configuration for e2e tests.
  test.skip('Stage 6: Ego Census Tract (Geospatial)', async ({ stage }) => {
    await stage.page.goto(`/interview/${stage.interview.id}?step=6`);
    await expect(stage.interview.nextButton).toBeVisible({ timeout: 15_000 });

    await stage.captureStart();

    // This is a Geospatial stage - would need to interact with the map
    // For now, use "Outside Selectable Areas" button
    await stage.interview.clickOutsideMapArea();

    await expect(stage.interview.nextButton).toBeEnabled();

    await stage.captureComplete();
  });

  test.skip('Stage 7: Ego Substances', async ({ stage }) => {
    // Skip the geospatial stage (step=6) and go directly to substances (step=7)
    await stage.page.goto(`/interview/${stage.interview.id}?step=7`);
    await expect(stage.interview.nextButton).toBeVisible({ timeout: 15_000 });

    await stage.captureStart();

    // Verify the form is visible
    await expect(stage.page.getByText('drugs you have used')).toBeVisible();

    // Fill substance use fields (boolean toggles)
    // Marijuana - Yes
    await stage.interview.fillFormField(
      EGO_VARIABLES.marijuanaUsed,
      EGO_SUBSTANCES_DATA.marijuanaUsed ? 'Yes' : 'No',
    );

    // Cocaine - No
    await stage.interview.fillFormField(
      EGO_VARIABLES.cocaineUsed,
      EGO_SUBSTANCES_DATA.cocaineUsed ? 'Yes' : 'No',
    );

    // Heroin - No
    await stage.interview.fillFormField(
      EGO_VARIABLES.heroinUsed,
      EGO_SUBSTANCES_DATA.heroinUsed ? 'Yes' : 'No',
    );

    // Painkillers - No
    await stage.interview.fillFormField(
      EGO_VARIABLES.painkillersUsed,
      EGO_SUBSTANCES_DATA.painkillersUsed ? 'Yes' : 'No',
    );

    // Poppers - Yes (enables chemsex stage)
    await stage.interview.fillFormField(
      EGO_VARIABLES.poppersUsed,
      EGO_SUBSTANCES_DATA.poppersUsed ? 'Yes' : 'No',
    );

    // Meth - Yes (enables chemsex stage)
    await stage.interview.fillFormField(
      EGO_VARIABLES.methUsed,
      EGO_SUBSTANCES_DATA.methUsed ? 'Yes' : 'No',
    );

    // Should now be able to proceed
    await expect(stage.interview.nextButton).toBeEnabled();

    await stage.captureComplete();
  });
});
