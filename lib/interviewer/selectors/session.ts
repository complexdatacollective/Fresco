import type { Stage } from '@codaco/shared-consts';
import { createDeepEqualSelector } from './utils';
import { getProtocolStages } from './protocol';
import { createSelector } from '@reduxjs/toolkit';
import type { RootState, Session } from '../store';

export type SessionState = Record<string, unknown>;

export type SessionsState = Record<string, Session>;

export const getActiveSessionId = (state: RootState) => state.activeSessionId;

export const getSessions = (state: RootState) => state.sessions;

export const getActiveSession = createSelector(
  getActiveSessionId,
  getSessions,
  (activeSessionId, sessions) => {
    return sessions[activeSessionId]!;
  },
);

export const getLastActiveSession = createSelector(getSessions, (sessions) => {
  const lastActiveSession = Object.keys(sessions).reduce(
    (lastSessionId: string | null, sessionId) => {
      const session = sessions[sessionId]!;
      if (
        !lastSessionId ||
        (session.lastUpdated &&
          session.lastUpdated > sessions[lastSessionId]!.lastUpdated)
      ) {
        return sessionId;
      }
      return lastSessionId;
    },
    null,
  );

  return lastActiveSession;
});

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

export const getCaseId = createDeepEqualSelector(
  getActiveSession,
  (session) => session?.caseId,
);

export const getPromptIndex = createSelector(
  getActiveSession,
  (session) => session?.promptIndex ?? 0,
);

export const getCurrentPrompt = createSelector(
  getCurrentStage,
  getPromptIndex,
  (stage, promptIndex) => stage?.prompts?.[promptIndex],
);

export const getPrompts = createSelector(
  getCurrentStage,
  (stage) => stage?.prompts,
);

export const getPromptCount = createSelector(
  getPrompts,
  (prompts) => prompts?.length ?? 1, // If there are no prompts we have "1" prompt
);

export const getIsFirstPrompt = createSelector(
  getPromptIndex,
  (promptIndex) => promptIndex === 0,
);

export const getIsLastPrompt = createSelector(
  getPromptIndex,
  getPromptCount,
  (promptIndex, promptCount) => promptIndex === promptCount - 1,
);

export const getIsFirstStage = createSelector(
  getStageIndex,
  (currentStep) => currentStep === 0,
);

export const getIsLastStage = createSelector(
  getStageIndex,
  getProtocolStages,
  (currentStep, stages) => currentStep === stages.length - 1,
);

export const getStageCount = createSelector(
  getProtocolStages,
  (stages) => stages.length,
);

export const getSessionProgress = createSelector(
  getStageIndex,
  getStageCount,
  getPromptIndex,
  getPromptCount,
  (currentStep, stageCount, promptIndex, promptCount) => {
    if (currentStep === null) return 0;

    const stageProgress = currentStep / (stageCount - 1);
    const stageWorth = 1 / stageCount; // The amount of progress each stage is worth

    const promptProgress = promptCount === 1 ? 1 : promptIndex / promptCount; // 1 when finished

    const promptWorth = promptProgress * stageWorth;

    const percentProgress = (stageProgress + promptWorth) * 100;

    return percentProgress;
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

export const anySessionIsActive = createSelector(
  getActiveSession,
  (session) => !!session,
);
