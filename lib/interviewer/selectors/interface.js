import { createSelector } from '@reduxjs/toolkit';
import { getCodebook } from '../ducks/modules/protocol';
import {
  getPromptOtherVariable,
  getPromptVariable,
  getSubjectType,
} from './prop';

// Selectors that are generic between interfaces

/*
These selectors assume the following props:
  stage: which contains the protocol config for the stage
  prompt: which contains the protocol config for the prompt
*/

export const getNodeVariables = createSelector(
  getCodebook,
  getSubjectType,
  (codebook, nodeType) => {
    const nodeInfo = codebook.node;
    return nodeInfo?.[nodeType]?.variables || {};
  },
);

export const makeGetVariableOptions = (includeOtherVariable = false) =>
  createSelector(
    getNodeVariables,
    getPromptVariable,
    getPromptOtherVariable,
    (
      nodeVariables,
      promptVariable,
      [promptOtherVariable, promptOtherOptionLabel, promptOtherVariablePrompt],
    ) => {
      const optionValues = nodeVariables[promptVariable]?.options || [];
      const otherValue = {
        label: promptOtherOptionLabel,
        value: null,
        otherVariablePrompt: promptOtherVariablePrompt,
        otherVariable: promptOtherVariable,
      };

      return includeOtherVariable && promptOtherVariable
        ? [...optionValues, otherValue]
        : optionValues;
    },
  );
