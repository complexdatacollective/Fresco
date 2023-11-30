/* eslint-disable no-shadow */
import { createSelector } from 'reselect';
import {
  clamp, orderBy, values, mapValues, omit,
} from 'lodash';
import { entityAttributesProperty } from '@codaco/shared-consts';
import { getAdditionalAttributes, getStageOrPromptSubject } from '../utils/protocol/accessors';
import { createDeepEqualSelector } from './utils';
import { getProtocolCodebook, getProtocolStages, getCurrentSessionProtocol } from './protocol';
import { get } from '../utils/lodash-replacements';

export const getActiveSession = (state) => (
  state.activeSessionId && state.sessions[state.activeSessionId]
);

export const getLastActiveSession = (state) => {
  if (Object.keys(state.sessions).length === 0) {
    return {};
  }

  const sessionsCollection = values(mapValues(state.sessions, (session, uuid) => ({
    sessionUUID: uuid,
    ...session,
  })));

  const lastActive = orderBy(sessionsCollection, ['updatedAt', 'caseId'], ['desc', 'asc'])[0];
  return {
    sessionUUID: lastActive.sessionUUID,
    [entityAttributesProperty]: {
      ...omit(lastActive, 'sessionUUID'),
    },
  };
};

export const getStageIndex = createSelector(
  getActiveSession,
  (session) => (session && session.stageIndex) || 0,
);

export const getCurrentStage = createSelector(
  getProtocolStages,
  getStageIndex,
  (stages, stageIndex) => stages[stageIndex],
)

export const getPromptIndex = createSelector(
  getActiveSession,
  (session) => (session && session.promptIndex) || 0,
);

export const getCurrentPrompt = createSelector(
  getCurrentStage,
  getPromptIndex,
  (stage, promptIndex) => stage && stage.prompts && stage.prompts[promptIndex],
)

export const getCaseId = createDeepEqualSelector(
  getActiveSession,
  (session) => (session && session.caseId),
);

export const getPrompts = createSelector(
  getCurrentStage,
  (stage) => stage && stage.prompts,
);

export const getPromptCount = createSelector(
  getPrompts,
  (prompts) => prompts && prompts.length,
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
    // This can go over 100% when finish screen is not present,
    // so it needs to be clamped <- JRM 2023 WTF???
    const percentProgress = clamp(
      (stageProgress + (promptProgress / (stageCount - 1))) * 100,
      0,
      100,
    );

    return percentProgress;
  });


export const getNavigationInfo = createSelector(
  getSessionProgress,
  getStageIndex,
  getPromptIndex,
  getIsFirstPrompt,
  getIsLastPrompt,
  getIsFirstStage,
  getIsLastStage,
  (progress, stageIndex, promptIndex, isFirstPrompt, isLastPrompt, isFirstStage, isLastStage) => ({
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
)

export const getStageForCurrentSession = createSelector(
  getProtocolStages,
  getStageIndex,
  (stages, stageIndex) => stages[stageIndex],
);

export const getSessionStageSubject = createSelector(
  getStageForCurrentSession,
  (stage) => stage.subject,
);

export const makeGetSessionStageSubject = () => getSessionStageSubject

export const getStageSubjectType = () => createSelector(
  getSessionStageSubject,
  (subject) => subject && subject.type,
);

export const getCodebookVariablesForType = createSelector(
  getProtocolCodebook,
  getSessionStageSubject,
  (codebook, subject) => codebook
    && (subject ? codebook[subject.entity][subject.type].variables : codebook.ego.variables),
);

export const makeGetCodebookVariablesForType = () => getCodebookVariablesForType;

const getPromptForCurrentSession = createSelector(
  getStageForCurrentSession,
  getPromptIndex,
  (stage, promptIndex) => stage && stage.prompts && stage.prompts[promptIndex],
);

// @return {Array} An object entry ([key, object]) for the current node type
//  from the variable registry
export const getNodeEntryForCurrentPrompt = createSelector(
  (state, props) => getProtocolCodebook(state, props),
  getPromptForCurrentSession,
  getStageForCurrentSession,
  (registry, prompt, stage) => {
    if (!registry || !registry.node || !prompt || !stage) {
      return null;
    }
    const subject = getStageOrPromptSubject(stage, prompt);
    const nodeType = subject && subject.type;
    const nodeTypeDefinition = nodeType && registry.node[nodeType];
    if (nodeTypeDefinition) {
      return [nodeType, nodeTypeDefinition];
    }
    return null;
  },
);

export const getAdditionalAttributesForCurrentPrompt = createSelector(
  getPromptForCurrentSession,
  getStageForCurrentSession,
  (prompt, stage) => getAdditionalAttributes(stage, prompt),
);
