import type { Stage, NcNetwork } from '@codaco/shared-consts';
import { createDeepEqualSelector } from './utils';
import { getProtocolStages } from './protocol';
import { createSelector } from '@reduxjs/toolkit';

export type SessionState = Record<string, unknown>;

export type Session = {
  protocolUid: string;
  promptIndex: number;
  stageIndex: number;
  caseId: string;
  network: NcNetwork;
  startedAt: Date;
  updatedAt: Date;
  finishedAt: Date;
  exportedAt: Date;
  stages?: SessionState;
};

export type SessionsState = Record<string, Session>;

export type State = {
  activeSessionId: string;
  sessions: SessionsState;
};

export const getActiveSessionId = (state: State) => state.activeSessionId;

export const getSessions = (state: State) => state.sessions;

export const getActiveSession = createSelector(
  getActiveSessionId,
  getSessions,
  (activeSessionId, sessions) => sessions[activeSessionId],
);

export const getLastActiveSession = createSelector(getSessions, (sessions) => {
  const lastActiveSession = Object.keys(sessions).reduce(
    (lastSessionId: string | null, sessionId) => {
      const session = sessions[sessionId]!;
      if (
        !lastSessionId ||
        (session.updatedAt &&
          session.updatedAt > sessions[lastSessionId]!.updatedAt)
      ) {
        return sessionId;
      }
      return lastSessionId;
    },
    null,
  );

  return lastActiveSession;
});

export const getStageIndex = createSelector(
  getActiveSession,
  (session) => session?.stageIndex ?? 0,
);

export const getCurrentStage = createSelector(
  getProtocolStages,
  getStageIndex,
  (stages: Stage[], stageIndex) => stages[stageIndex],
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

export const getCaseId = createDeepEqualSelector(
  getActiveSession,
  (session) => session?.caseId,
);

export const getPrompts = createSelector(
  getCurrentStage,
  (stage) => stage?.prompts,
);

export const getPromptCount = createSelector(
  getPrompts,
  (prompts) => prompts?.length ?? 0,
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
  (stageIndex) => stageIndex === 0,
);

export const getIsLastStage = createSelector(
  getStageIndex,
  getProtocolStages,
  (stageIndex, stages) => stageIndex === stages.length - 1,
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
  (stageIndex, stageCount, promptIndex, promptCount) => {
    const stageProgress = stageIndex / (stageCount - 1);
    const promptProgress = promptCount ? promptIndex / promptCount : 0;
    const percentProgress =
      stageProgress + (promptProgress / (stageCount - 1)) * 100;

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
    stageIndex,
    promptIndex,
    isFirstPrompt,
    isLastPrompt,
    isFirstStage,
    isLastStage,
  ) => ({
    progress,
    stageIndex,
    promptIndex,
    isFirstPrompt,
    isLastPrompt,
    isFirstStage,
    isLastStage,
  }),
);

export const anySessionIsActive = createSelector(
  getActiveSession,
  (session) => !!session,
);

export const getStageForCurrentSession = createSelector(
  getProtocolStages,
  getStageIndex,
  (stages: Stage[], stageIndex) => stages[stageIndex],
);
