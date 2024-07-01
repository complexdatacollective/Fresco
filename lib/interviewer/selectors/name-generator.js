import { createSelector } from '@reduxjs/toolkit';
import { has } from 'lodash';
import { getPromptId } from './interface';
import { getStageSubject, getSubjectType, propStageId } from './prop';
import { getProtocolCodebook } from './protocol';

// Selectors that are specific to the name generator

/*
These selectors assume the following props:
  stage: which contains the protocol config for the stage
  prompt: which contains the protocol config for the prompt
*/


// MemoedSelectors

const stageCardOptions = (_, props) => props.stage.cardOptions;
const propPanels = (_, props) => props.stage.panels;

const getIDs = createSelector(
  propStageId,
  getPromptId,
  (stageId, promptId) => {
    return {
      stageId,
      promptId,
    };
  },
)

export const getPromptModelData = createSelector(
  getStageSubject,
  getIDs,
  ({ type }, { stageId, promptId }) => {
    return {
      type,
      stageId,
      promptId,
    };
  },
)

// Returns any additional properties to be displayed on cards.
// Returns an empty array if no additional properties are specified in the protocol.
export const getCardAdditionalProperties = createSelector(
  stageCardOptions,
  (cardOptions) => (has(cardOptions, 'additionalProperties') ? cardOptions.additionalProperties : []),
);


export const getNodeIconName = createSelector(
  getProtocolCodebook,
  getSubjectType,
  (codebook, nodeType) => {
    const nodeInfo = codebook.node;
    return (nodeInfo && nodeInfo[nodeType] && nodeInfo[nodeType].iconVariant) || 'add-a-person';
  },
);