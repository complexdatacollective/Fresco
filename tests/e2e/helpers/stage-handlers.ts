import { type Page } from '@playwright/test';
import { type InterviewPage } from '../fixtures/interview-page.js';

/**
 * Stage handlers for SILOS protocol E2E tests.
 *
 * These handlers encapsulate the interaction logic for each stage type,
 * making the main test file cleaner and more maintainable.
 */

// ============================================================
// Information Stage Handler
// ============================================================

/**
 * Handle an Information stage - just navigate through.
 * Information stages are read-only with no data entry required.
 */
export async function handleInformationStage(
  interview: InterviewPage,
): Promise<void> {
  // Wait for content to be visible
  await interview.waitForStageContent();

  // Information stages should have navigation enabled immediately
  await interview.waitForNextEnabled();
  await interview.navigateNext();
}

// ============================================================
// EgoForm Stage Handlers
// ============================================================

/**
 * Handle the Ego Information form (Stage 4).
 * This is the main demographics form that determines eligibility.
 */
export async function handleEgoInformationForm(
  interview: InterviewPage,
  data: {
    dateOfBirth: string;
    sexualIdentity: string;
    sexAssignedAtBirth: string;
    gender: string;
    race: string[];
    hispanic: string;
    yearsLived: string;
    hivStatus: string;
  },
): Promise<void> {
  const { page } = interview;

  // Wait for form to load
  await interview.waitForStageContent();

  // Fill date of birth
  await fillDateField(page, data.dateOfBirth);

  // Select sexual identity (radio/ordinal)
  await selectOrdinalOption(page, data.sexualIdentity);

  // Select sex assigned at birth - CRITICAL for skip logic
  await selectCategoricalOption(page, data.sexAssignedAtBirth);

  // Select gender
  await selectOrdinalOption(page, data.gender);

  // Select race (categorical, may be multi-select)
  for (const race of data.race) {
    await selectCategoricalOption(page, race);
  }

  // Select Hispanic/Latino
  await selectBooleanOption(page, data.hispanic);

  // Fill years lived (number input)
  await fillNumberField(page, data.yearsLived);

  // Select HIV status
  await selectOrdinalOption(page, data.hivStatus);

  // Navigate to next stage
  await interview.waitForNextEnabled();
  await interview.navigateNext();
}

/**
 * Handle the Perceived by Others form (Stage 7).
 */
export async function handlePerceivedByOthersForm(
  interview: InterviewPage,
  data: {
    perceivedRace: string;
    perceivedHispanic: string;
    perceivedGender: string;
    perceivedSexualIdentity: string;
  },
): Promise<void> {
  const { page } = interview;

  await interview.waitForStageContent();

  await selectOrdinalOption(page, data.perceivedRace);
  await selectBooleanOption(page, data.perceivedHispanic);
  await selectOrdinalOption(page, data.perceivedGender);
  await selectOrdinalOption(page, data.perceivedSexualIdentity);

  await interview.waitForNextEnabled();
  await interview.navigateNext();
}

/**
 * Handle the Substances form (Stage 10).
 */
export async function handleSubstancesForm(
  interview: InterviewPage,
  data: Record<string, boolean>,
): Promise<void> {
  const { page } = interview;

  await interview.waitForStageContent();

  // Each substance is a boolean yes/no field
  for (const used of Object.values(data)) {
    if (used) {
      // Click "Yes" for this substance
      await selectBooleanOption(page, 'Yes');
    } else {
      await selectBooleanOption(page, 'No');
    }
  }

  await interview.waitForNextEnabled();
  await interview.navigateNext();
}

/**
 * Handle a generic EgoForm stage by clicking through boolean options.
 */
export async function handleGenericEgoForm(
  interview: InterviewPage,
  selections: string[],
): Promise<void> {
  const { page } = interview;

  await interview.waitForStageContent();

  for (const selection of selections) {
    await selectOrdinalOption(page, selection);
  }

  await interview.waitForNextEnabled();
  await interview.navigateNext();
}

// ============================================================
// NameGenerator Stage Handlers
// ============================================================

/**
 * Handle a NameGeneratorQuickAdd stage.
 * Adds nodes using the quick add interface.
 */
export async function handleNameGeneratorQuickAdd(
  interview: InterviewPage,
  nodesToAdd: { name: string }[],
): Promise<void> {
  await interview.waitForStageContent();

  for (const node of nodesToAdd) {
    await interview.quickAddNode(node.name);
  }

  await interview.waitForNextEnabled();
  await interview.navigateNext();
}

/**
 * Handle a NameGenerator stage with full forms.
 * Adds nodes using the form interface.
 */
export async function handleNameGeneratorWithForm(
  interview: InterviewPage,
  nodesToAdd: Record<string, string>[],
): Promise<void> {
  await interview.waitForStageContent();

  for (const nodeData of nodesToAdd) {
    await interview.addNodeWithForm(nodeData);
  }

  await interview.waitForNextEnabled();
  await interview.navigateNext();
}

/**
 * Handle a multi-prompt NameGenerator stage.
 * Advances through prompts, optionally adding nodes at each.
 */
export async function handleMultiPromptNameGenerator(
  interview: InterviewPage,
  promptData: {
    nodesToAdd?: Record<string, string>[];
    skipPrompt?: boolean;
  }[],
): Promise<void> {
  await interview.waitForStageContent();

  for (const prompt of promptData) {
    if (prompt.nodesToAdd) {
      for (const nodeData of prompt.nodesToAdd) {
        await interview.addNodeWithForm(nodeData);
      }
    }

    // Navigate to next prompt or stage
    await interview.waitForNextEnabled();
    await interview.navigateNext();
  }
}

// ============================================================
// Sociogram Stage Handler
// ============================================================

/**
 * Handle a Sociogram stage.
 * Creates edges between nodes.
 */
export async function handleSociogramStage(
  interview: InterviewPage,
  edges: { source: string; target: string }[],
): Promise<void> {
  await interview.waitForStageContent();

  // Wait for sociogram to render
  await interview.page.waitForTimeout(500);

  for (const edge of edges) {
    await interview.createSociogramEdge(edge.source, edge.target);
  }

  await interview.waitForNextEnabled();
  await interview.navigateNext();
}

// ============================================================
// Bin Stage Handlers
// ============================================================

/**
 * Handle an OrdinalBin stage.
 * Drags nodes to ordered bin positions.
 */
export async function handleOrdinalBinStage(
  interview: InterviewPage,
  assignments: Record<string, string>,
): Promise<void> {
  const { page } = interview;

  await interview.waitForStageContent();

  // Wait for bins to render
  await page.waitForTimeout(500);

  for (const [nodeName, binLabel] of Object.entries(assignments)) {
    await interview.dragNodeToBin(nodeName, binLabel);
  }

  await interview.waitForNextEnabled();
  await interview.navigateNext();
}

/**
 * Handle a CategoricalBin stage.
 * Drags nodes to category bins.
 */
export async function handleCategoricalBinStage(
  interview: InterviewPage,
  assignments: Record<string, string>,
): Promise<void> {
  const { page } = interview;

  await interview.waitForStageContent();

  // Wait for bins to render
  await page.waitForTimeout(500);

  for (const [nodeName, binLabel] of Object.entries(assignments)) {
    await interview.dragNodeToBin(nodeName, binLabel);
  }

  await interview.waitForNextEnabled();
  await interview.navigateNext();
}

// ============================================================
// Geospatial Stage Handler
// ============================================================

/**
 * Handle a Geospatial stage.
 * Either clicks on the map or uses the "outside area" option.
 */
export async function handleGeospatialStage(
  interview: InterviewPage,
  options: {
    clickOutside?: boolean;
    waitForMap?: boolean;
  } = {},
): Promise<void> {
  const { page } = interview;

  await interview.waitForStageContent();

  if (options.waitForMap !== false) {
    // Wait for mapbox to load
    await page.waitForTimeout(2000);
  }

  if (options.clickOutside) {
    await interview.clickOutsideMapArea();
  } else {
    // For testing, just click "outside" to skip map selection
    // In a real test, you'd click specific map coordinates
    await interview.clickOutsideMapArea();
  }

  await interview.waitForNextEnabled();
  await interview.navigateNext();
}

// ============================================================
// AlterForm Stage Handler
// ============================================================

/**
 * Handle an AlterForm stage.
 * Fills form for each alter that needs it.
 */
export async function handleAlterFormStage(
  interview: InterviewPage,
  formData: Record<string, string[]>,
): Promise<void> {
  const { page } = interview;

  await interview.waitForStageContent();

  // AlterForm stages show one form per alter
  // For each alter, we need to fill the form fields
  for (const selections of Object.values(formData)) {
    for (const selection of selections) {
      await selectOrdinalOption(page, selection);
    }
  }

  await interview.waitForNextEnabled();
  await interview.navigateNext();
}

// ============================================================
// Form Field Helpers
// ============================================================

/**
 * Select an ordinal option by clicking the label.
 */
async function selectOrdinalOption(page: Page, label: string): Promise<void> {
  // Try to find by role first
  const option = page.getByRole('radio', { name: new RegExp(label, 'i') });
  if (await option.isVisible()) {
    await option.click();
    return;
  }

  // Fallback to text content
  const labelElement = page.getByText(label, { exact: false });
  if (await labelElement.isVisible()) {
    await labelElement.click();
  }
}

/**
 * Select a categorical option (may support multiple selections).
 */
async function selectCategoricalOption(
  page: Page,
  label: string,
): Promise<void> {
  // Similar to ordinal but may use checkboxes
  const checkbox = page.getByRole('checkbox', { name: new RegExp(label, 'i') });
  if (await checkbox.isVisible()) {
    await checkbox.check();
    return;
  }

  // Try radio
  const radio = page.getByRole('radio', { name: new RegExp(label, 'i') });
  if (await radio.isVisible()) {
    await radio.click();
    return;
  }

  // Fallback to text
  const labelElement = page.getByText(label, { exact: false });
  if (await labelElement.isVisible()) {
    await labelElement.click();
  }
}

/**
 * Select a boolean option (Yes/No).
 */
async function selectBooleanOption(page: Page, label: string): Promise<void> {
  const option = page.getByRole('radio', { name: new RegExp(label, 'i') });
  if (await option.isVisible()) {
    await option.click();
    return;
  }

  const labelElement = page.getByText(label, { exact: false });
  if (await labelElement.isVisible()) {
    await labelElement.click();
  }
}

/**
 * Fill a date field.
 */
async function fillDateField(page: Page, value: string): Promise<void> {
  const dateInput = page.locator('input[type="date"]').first();
  if (await dateInput.isVisible()) {
    await dateInput.fill(value);
    return;
  }

  // Try text input as fallback
  const textInput = page.getByRole('textbox').first();
  if (await textInput.isVisible()) {
    await textInput.fill(value);
  }
}

/**
 * Fill a number field.
 */
async function fillNumberField(page: Page, value: string): Promise<void> {
  const numberInput = page.locator('input[type="number"]').first();
  if (await numberInput.isVisible()) {
    await numberInput.fill(value);
    return;
  }

  // Try spinbutton role
  const spinButton = page.getByRole('spinbutton').first();
  if (await spinButton.isVisible()) {
    await spinButton.fill(value);
    return;
  }

  // Try text input as fallback
  const textInput = page.getByRole('textbox').first();
  if (await textInput.isVisible()) {
    await textInput.fill(value);
  }
}

// ============================================================
// Stage Navigation Helpers
// ============================================================

/**
 * Skip through multiple Information stages.
 */
export async function skipInformationStages(
  interview: InterviewPage,
  count: number,
): Promise<void> {
  for (let i = 0; i < count; i++) {
    await handleInformationStage(interview);
  }
}

/**
 * Log current stage for debugging.
 */
export function logCurrentStage(
  interview: InterviewPage,
  stageName: string,
): void {
  const step = interview.getCurrentStep();
  // eslint-disable-next-line no-console
  console.log(`[Stage ${step}] ${stageName}`);
}

/**
 * Take a screenshot for debugging.
 */
export async function captureStageScreenshot(
  interview: InterviewPage,
  name: string,
): Promise<void> {
  await interview.page.screenshot({
    path: `test-results/stage-${name}.png`,
    fullPage: true,
  });
}

/**
 * Wait for any animations to complete before proceeding.
 */
export async function waitForAnimations(page: Page): Promise<void> {
  // Wait for motion animations to settle
  await page.waitForTimeout(500);

  // Ensure no pending network requests
  await page.waitForLoadState('networkidle');
}
