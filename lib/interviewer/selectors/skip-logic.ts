import { createSelector } from '@reduxjs/toolkit';
import getQuery from '~/lib/network-query/query';
import type { NcNetwork, SkipDefinition, Stage } from '~/lib/shared-consts';
import { SkipLogicAction } from '../protocol-consts';
import { getNetwork } from './network';
import { getProtocolStages } from './protocol';
import { getStageIndex } from './session';

const formatQueryParameters = (params: Record<string, unknown>) => ({
  rules: [],
  join: null,
  ...params,
});

// Hacked together version of isStageSkipped that returns a map of all stages.
// This is more convinient to use with useSelector.
const getSkipMap = createSelector(
  getProtocolStages,
  getNetwork,
  (stages: Stage[], network: NcNetwork | undefined): Record<number, boolean> =>
    stages.reduce(
      (acc: Record<number, boolean>, stage: Stage, index: number) => {
        const skipLogic: SkipDefinition | null = stage.skipLogic ?? null;

        if (!skipLogic) {
          return {
            ...acc,
            [index]: false,
          };
        }

        const skipOnMatch = skipLogic.action === SkipLogicAction.SKIP;

        const queryParameters = formatQueryParameters(skipLogic.filter);
        const result = getQuery(queryParameters)(network);
        const isSkipped = (skipOnMatch && result) || (!skipOnMatch && !result);

        return {
          ...acc,
          [index]: isSkipped,
        };
      },
      {},
    ),
);

// Selector that uses the skipMap to determine the idex of the next and previous
// valid stages.
export const getNavigableStages = createSelector(
  getSkipMap,
  getStageIndex,
  (skipMap, currentStep) => {
    const isCurrentStepValid = !skipMap[currentStep];

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
