import { isEqual } from 'es-toolkit';
import { createSelectorCreator, defaultMemoize } from 'reselect';

// create a "selector creator" that uses lodash.isEqual instead of ===
export const createDeepEqualSelector = createSelectorCreator(
  defaultMemoize,
  isEqual,
);

/**
 * Utility function to calculate the progress of the interview.
 * Used in the progress bar as well as the getSessionProgress selector.
 */
export function calculateProgress(
  currentStep: number,
  totalSteps: number,
  currentPrompt: number,
  totalPrompts: number,
) {
  // Don't subtract 1 because we have a finish stage automatically added that isn't accounted for.
  const stageProgress = currentStep / totalSteps;

  const stageWorth = 1 / totalSteps; // The amount of progress each stage is worth

  const promptProgress = totalPrompts === 1 ? 1 : currentPrompt / totalPrompts; // 1 when finished

  const promptWorth = promptProgress * stageWorth;

  const percentProgress = (stageProgress + promptWorth) * 100;

  console.log('calculate progress', {
    currentStep,
    totalSteps,
    currentPrompt,
    totalPrompts,
    percentProgress,
  });
  return percentProgress;
}
