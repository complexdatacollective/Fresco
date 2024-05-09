import type { Stage } from '@codaco/shared-consts';
import { getProtocolStages } from './protocol';
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';

const getActiveSessionId = (state: RootState) => state.activeSessionId;

const getSessions = (state: RootState) => state.sessions;

export const getActiveSession = createSelector(
  getActiveSessionId,
  getSessions,
  (activeSessionId, sessions) => {
    return sessions[activeSessionId]!;
  },
);

export const getStageIndex = createSelector(getActiveSession, (session) => {
  return session.currentStep;
});

// Stage stage is temporary storage for stages used by TieStrengthCensus and DyadCensus
export const getStageMetadata = createSelector(
  getActiveSession,
  getStageIndex,
  (session, stageIndex) => {
    return session.stageMetadata?.[stageIndex] ?? undefined;
  },
);

export const getCurrentStage = createSelector(
  getProtocolStages,
  getStageIndex,
  (stages: Stage[], currentStep) => {
    return stages[currentStep]!;
  },
);

export const getPromptIndex = createSelector(
  getActiveSession,
  (session) => session?.promptIndex ?? 0,
);

export const getPrompts = createSelector(
  getCurrentStage,
  (stage) => stage?.prompts,
);

const getPromptCount = createSelector(
  getPrompts,
  (prompts) => prompts?.length ?? 1, // If there are no prompts we have "1" prompt
);

const getIsFirstPrompt = createSelector(
  getPromptIndex,
  (promptIndex) => promptIndex === 0,
);

const getIsLastPrompt = createSelector(
  getPromptIndex,
  getPromptCount,
  (promptIndex, promptCount) => promptIndex === promptCount - 1,
);

const getIsFirstStage = createSelector(
  getStageIndex,
  (currentStep) => currentStep === 0,
);

const getIsLastStage = createSelector(
  getStageIndex,
  getProtocolStages,
  (currentStep, stages) => currentStep === stages.length - 1,
);

const getStageCount = createSelector(
  getProtocolStages,
  (stages) => stages.length,
);

const getSessionProgress = createSelector(
  getStageIndex,
  getStageCount,
  getPromptIndex,
  getPromptCount,
  (currentStep, stageCount, promptIndex, promptCount) => {
    if (currentStep === null) return 0;

    // Don't subtract 1 because we have a finish stage automatically added that isn't accounted for.
    const stageProgress = currentStep / stageCount;

    const stageWorth = 1 / stageCount; // The amount of progress each stage is worth

    const promptProgress = promptCount === 1 ? 1 : promptIndex / promptCount; // 1 when finished

    const promptWorth = promptProgress * stageWorth;

    const percentProgress = (stageProgress + promptWorth) * 100;

    return percentProgress;
  },
);

// Used to calculate what the progress _will be_ once the next stage is loaded. Can update the
// progress bar with this.
export const makeGetFakeSessionProgress = createSelector(
  getStageCount,
  getPromptCount,
  (stageCount, promptCount) => {
    return (currentStep: number, promptIndex: number) => {
      if (currentStep === null) return 0;

      // Don't subtract 1 because we have a finish stage automatically added that isn't accounted for.
      const stageProgress = currentStep / stageCount;

      const stageWorth = 1 / stageCount; // The amount of progress each stage is worth

      const promptProgress = promptCount === 1 ? 1 : promptIndex / promptCount; // 1 when finished

      const promptWorth = promptProgress * stageWorth;

      const percentProgress = (stageProgress + promptWorth) * 100;

      return percentProgress;
    };
  },
);

export const getNavigationInfo = createSelector(
  getSessionProgress,
  getStageIndex,
  getPromptIndex,
  getIsFirstPrompt,
  getIsLastPrompt,
  getIsFirstStage,
  getIsLastStage,
  (
    progress,
    currentStep,
    promptIndex,
    isFirstPrompt,
    isLastPrompt,
    isFirstStage,
    isLastStage,
  ) => ({
    progress,
    currentStep,
    promptIndex,
    isFirstPrompt,
    isLastPrompt,
    isFirstStage,
    isLastStage,
    canMoveForward: !(isLastPrompt && isLastStage),
    canMoveBackward: !(isFirstPrompt && isFirstStage),
  }),
);
