import getQuery from '~/lib/network-query/query';
import { getProtocolStages } from './protocol';
import { getNetwork } from './network';
import { SkipLogicAction } from '../protocol-consts';
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { NcNetwork, SkipDefinition, Stage } from '@codaco/shared-consts';
import { getStageIndex } from './session';

const rotateIndex = (max: number, nextIndex: number) => (nextIndex + max) % max;

const maxLength = (state: RootState) => getProtocolStages(state).length;

const getNextIndex = (index: number) =>
  createSelector(maxLength, (max) => rotateIndex(max, index));

const getSkipLogic = (index: number) =>
  createSelector(
    getProtocolStages,
    (stages: Stage[]) => stages?.[index]?.skipLogic,
  );

/**
 * @returns {boolean} true for skip (when query matches), false for show (when query matches)
 */
const isSkipAction = (index: number) =>
  createSelector(
    getSkipLogic(index),
    (logic) => logic && logic.action === SkipLogicAction.SKIP,
  );

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

const isStageSkipped = (index: number) =>
  createSelector(
    getSkipLogic(index),
    isSkipAction(index),
    getNetwork,
    (logic, skipOnMatch, network) => {
      if (!logic) {
        return false;
      }

      // Handle skipLogic with no rules defined differently depending on action.
      // skipLogic.action === SHOW <- always show the stage
      // skipLogic.action === SKIP <- always skip the stage
      // Allows for a quick way to disable a stage by setting SKIP if, and then
      // not defining rules.
      // Should be changed with https://github.com/complexdatacollective/Architect/issues/517
      if (logic.filter?.rules && logic.filter.rules.length === 0) {
        // eslint-disable-next-line no-console
        console.warn(
          'Encountered skip logic with no rules defined at index',
          index,
        ); // eslint-disable-line no-console
        return !!skipOnMatch;
      }

      const queryParameters = formatQueryParameters(logic.filter);
      const result = getQuery(queryParameters)(network);
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      const isSkipped = (skipOnMatch && result) || (!skipOnMatch && !result);

      return isSkipped;
    },
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
