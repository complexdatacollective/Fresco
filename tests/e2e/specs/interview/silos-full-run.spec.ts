import fs from 'node:fs/promises';
import path from 'node:path';
import { InterviewPage } from '../../fixtures/interview-page.js';
import {
  CLOSE_TIES,
  EGO_FORM_DATA,
  EGO_PERCEIVED_DATA,
  PERSON_VARIABLES,
  SELF_NOMINATION,
} from '../../fixtures/silos-test-data.js';
import { test } from '../../fixtures/test.js';
import {
  handleGeospatialStage,
  handleInformationStage,
  handleNameGeneratorQuickAdd,
  logCurrentStage,
} from '../../helpers/stage-handlers.js';

// Load the SILOS protocol JSON
const SILOS_PROTOCOL_PATH = path.join(
  import.meta.dirname,
  '../../data/SILOS-protocol.json',
);

/**
 * SILOS Protocol Full Run-Through Tests
 *
 * These tests run through the complete SILOS protocol to verify
 * all stage types work correctly in sequence.
 *
 * The "happy path" follows the male eligibility path which exercises
 * the maximum number of stage types.
 */
test.describe('SILOS Protocol Full Run-Through', () => {
  // These tests must run serially since they depend on sequential state
  test.describe.configure({ mode: 'serial' });

  // TODO: Re-enable once infrastructure issues are resolved
  test('completes full interview via preview mode (male path)', async ({
    page,
    database,
  }, testInfo) => {
    // This is a long-running test - extend timeout to 15 minutes
    testInfo.setTimeout(15 * 60 * 1000);

    const cleanup = await database.isolate(page, testInfo);
    try {
      // ============================================================
      // Setup: Load protocol and enable preview mode
      // ============================================================

      await test.step('Setup preview protocol', async () => {
        await database.enablePreviewMode(false);

        const silosProtocolJson = await fs.readFile(
          SILOS_PROTOCOL_PATH,
          'utf-8',
        );
        const silosProtocol = JSON.parse(silosProtocolJson) as Record<
          string,
          unknown
        >;

        const protocolId =
          await database.createPreviewProtocolFromJson(silosProtocol);

        // Navigate to interview
        const interview = new InterviewPage(page, 'preview', protocolId);
        await interview.start();

        // Store interview instance for subsequent steps
        (testInfo as unknown as { interview: InterviewPage }).interview =
          interview;
      });

      const interview = (testInfo as unknown as { interview: InterviewPage })
        .interview;

      // ============================================================
      // Stage 1: Welcome (Information)
      // ============================================================

      await test.step('Stage 1: Welcome', async () => {
        logCurrentStage(interview, 'Welcome');
        await handleInformationStage(interview);
      });

      // ============================================================
      // Stage 2: Self-Nomination Instructions (Information)
      // ============================================================

      await test.step('Stage 2: Self-Nomination Instructions', async () => {
        logCurrentStage(interview, 'Self-Nomination Instructions');
        await handleInformationStage(interview);
      });

      // ============================================================
      // Stage 3: Self-Nomination (NameGeneratorQuickAdd)
      // ============================================================

      await test.step('Stage 3: Self-Nomination', async () => {
        logCurrentStage(interview, 'Self-Nomination');
        await handleNameGeneratorQuickAdd(interview, [SELF_NOMINATION]);
      });

      // ============================================================
      // Stage 4: Ego Information (EgoForm)
      // ============================================================

      await test.step('Stage 4: Ego Information', async () => {
        logCurrentStage(interview, 'Ego Information');
        await interview.waitForStageContent();

        // Fill the ego form with male path data
        // This is simplified - in practice each field needs specific handling

        // Date of birth - use specific selector for date input with ISO format
        const dobInput = page.locator('input[type="date"]').first();
        await dobInput.fill(EGO_FORM_DATA.dateOfBirth);

        // Sexual identity - select option
        await page.getByText(EGO_FORM_DATA.sexualIdentity).first().click();

        // Sex assigned at birth - CRITICAL: Must be Male
        await page.getByText(EGO_FORM_DATA.sexAssignedAtBirth).first().click();

        // Gender
        await page.getByText(EGO_FORM_DATA.gender).first().click();

        // Race
        for (const race of EGO_FORM_DATA.race) {
          await page.getByText(race).first().click();
        }

        // Hispanic
        await page.getByText(EGO_FORM_DATA.hispanic).first().click();

        // Years lived
        const yearsInput = page.locator('input[type="number"]').first();
        if (await yearsInput.isVisible()) {
          await yearsInput.fill(EGO_FORM_DATA.yearsLived);
        }

        // HIV Status
        await page.getByText(EGO_FORM_DATA.hivStatus).first().click();

        await interview.waitForNextEnabled();
        await interview.navigateNext();
      });

      // Stages 5-6 are skipped for male path

      // ============================================================
      // Stage 7: Ego Information Perceived by Others (EgoForm)
      // ============================================================

      await test.step('Stage 7: Ego Perceived by Others', async () => {
        logCurrentStage(interview, 'Ego Perceived by Others');
        await interview.waitForStageContent();

        await page.getByText(EGO_PERCEIVED_DATA.perceivedRace).first().click();
        await page
          .getByText(EGO_PERCEIVED_DATA.perceivedHispanic)
          .first()
          .click();
        await page
          .getByText(EGO_PERCEIVED_DATA.perceivedGender)
          .first()
          .click();
        await page
          .getByText(EGO_PERCEIVED_DATA.perceivedSexualIdentity)
          .first()
          .click();

        await interview.waitForNextEnabled();
        await interview.navigateNext();
      });

      // ============================================================
      // Stage 8: Ego Census Tract Introduction (Information)
      // ============================================================

      await test.step('Stage 8: Ego Census Tract Introduction', async () => {
        logCurrentStage(interview, 'Ego Census Tract Introduction');
        await handleInformationStage(interview);
      });

      // ============================================================
      // Stage 9: Ego Census Tract (Geospatial)
      // ============================================================

      await test.step('Stage 9: Ego Census Tract', async () => {
        logCurrentStage(interview, 'Ego Census Tract');
        // For testing, just use "outside map area" to skip map selection
        await handleGeospatialStage(interview, { clickOutside: true });
      });

      // ============================================================
      // Stage 10: Ego Substances (EgoForm)
      // ============================================================

      await test.step('Stage 10: Ego Substances', async () => {
        logCurrentStage(interview, 'Ego Substances');
        await interview.waitForStageContent();

        // Select Yes for marijuana, poppers, meth to enable chemsex stages
        // The form has multiple yes/no questions
        const yesButtons = page.getByText('Yes').all();
        const noButtons = page.getByText('No').all();

        // We need to select specific options - this is simplified
        // In practice, iterate through each substance field
        const allYes = await yesButtons;
        const allNo = await noButtons;

        // Click Yes for first (marijuana), No for rest except poppers/meth
        if (allYes[0]) await allYes[0].click(); // Marijuana - Yes
        if (allNo[1]) await allNo[1].click(); // Cocaine - No
        if (allNo[2]) await allNo[2].click(); // Heroin - No
        if (allNo[3]) await allNo[3].click(); // Painkillers - No
        if (allYes[4]) await allYes[4].click(); // Poppers - Yes
        if (allYes[5]) await allYes[5].click(); // Meth - Yes

        await interview.waitForNextEnabled();
        await interview.navigateNext();
      });

      // ============================================================
      // Stage 11: Name Generator Instructions (Information)
      // ============================================================

      await test.step('Stage 11: Name Generator Instructions', async () => {
        logCurrentStage(interview, 'Name Generator Instructions');
        await handleInformationStage(interview);
      });

      // ============================================================
      // Stage 12: Name Generators - Close Ties and Drug (NameGenerator)
      // This has multiple prompts
      // ============================================================

      await test.step('Stage 12: Name Generators - Close Ties', async () => {
        logCurrentStage(interview, 'Name Generators - Close Ties');
        await interview.waitForStageContent();

        // First prompt: Close ties
        // Form fields use UUIDs as data-field-name, not human-readable names
        for (const person of CLOSE_TIES) {
          await interview.addNodeWithForm({
            [PERSON_VARIABLES.name]: person.name,
            [PERSON_VARIABLES.Age]: person.Age,
            [PERSON_VARIABLES.Relationship]: person.Relationship,
          });
        }

        // Navigate to next prompt
        await interview.waitForNextEnabled();
        await interview.navigateNext();
      });

      await test.step('Stage 12: Name Generators - Drug Partners', async () => {
        logCurrentStage(interview, 'Name Generators - Drug Partners');
        // Second prompt: Drug partners (can reuse from side panel)
        // For simplicity, just navigate through
        await interview.waitForNextEnabled();
        await interview.navigateNext();
      });

      // TODO: Continue implementation from Stage 13 onwards
      // Stage 13: Sex Partner Nomination - dialog not closing issue
    } finally {
      await cleanup();
    }
  });

  // TODO: Add test for female ineligible path once infrastructure issues are resolved
  // TODO: Add test for regular interview mode once infrastructure issues are resolved
});
