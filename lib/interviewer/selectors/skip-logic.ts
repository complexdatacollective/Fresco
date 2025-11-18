import { createSelector } from '@reduxjs/toolkit';
import getQuery from '~/lib/network-query/query';
import { getStages } from '../ducks/modules/protocol';
import { getNetwork, getStageIndex } from './session';

// Hacked together version of isStageSkipped that returns a map of all stages.
// This is more convenient to use with useSelector.
const getSkipMap = createSelector(
  getStages,
  getNetwork,
  (stages, network): Record<number, boolean> =>
    stages.reduce((acc: Record<number, boolean>, stage, index: number) => {
      const skipLogic = stage.skipLogic;

      if (!skipLogic) {
        return {
          ...acc,
          [index]: false,
        };
      }

      const skipOnMatch = skipLogic.action === 'SKIP';
      console.log('Evaluating skip logic for stage:', index, skipLogic.filter);
      const result = getQuery(skipLogic.filter)(network);
      const isSkipped = (skipOnMatch && result) || (!skipOnMatch && !result);

      return {
        ...acc,
        [index]: isSkipped,
      };
    }, {}),
);

// Selector that uses the skipMap to determine the idex of the next and previous
// valid stages.
export const getNavigableStages = createSelector(
  getSkipMap,
  getStageIndex,
  (skipMap, currentStep) => {
    // To determine if the current step is valid, we check if it is not skipped,
    // and that it is within the bounds of the skipMap.
    const isCurrentStepValid =
      !skipMap[currentStep] && skipMap[currentStep] !== undefined;

    const nextStage = Object.keys(skipMap).find(
      (stage) =>
        parseInt(stage) > currentStep && skipMap[parseInt(stage)] === false,
    );

    const previousStage = Object.keys(skipMap)
      .reverse()
      .find(
        (stage) =>
          parseInt(stage) < currentStep && skipMap[parseInt(stage)] === false,
      );

    return {
      isCurrentStepValid,
      nextValidStageIndex: nextStage ? parseInt(nextStage) : currentStep,
      previousValidStageIndex: previousStage
        ? parseInt(previousStage)
        : currentStep,
    };
  },
);
