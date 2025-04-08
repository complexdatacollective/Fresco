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
