import { type Variable } from '@codaco/protocol-validation';
import { entityAttributesProperty } from '@codaco/shared-consts';
import { createSelector } from '@reduxjs/toolkit';
import { getCodebook } from '../ducks/modules/protocol';
import { getPromptOtherVariable, getPromptVariable } from './prop';
import { getNetworkNodesForType, getSubjectType } from './session';

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

    return nodeType ? (nodeInfo?.[nodeType]?.variables ?? {}) : {};
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
      if (!promptVariable) {
        return [];
      }

      const variable = nodeVariables[promptVariable] as
        | Extract<Variable, { type: 'categorical' | 'ordinal' }>
        | undefined;

      const optionValues = variable?.options ?? [];
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

export const getUncategorisedNodes = createSelector(
  getPromptVariable,
  getPromptOtherVariable,
  getNetworkNodesForType,
  (activePromptVariable, [promptOtherVariable], stageNodes) => {
    if (!activePromptVariable && !promptOtherVariable) {
      return stageNodes;
    }

    return stageNodes.filter((node) => {
      const attributes = node[entityAttributesProperty];

      const activeVarExists = activePromptVariable
        ? !!attributes[activePromptVariable]
        : false;
      const otherVarExists = promptOtherVariable
        ? !!attributes[promptOtherVariable]
        : false;

      return !activeVarExists && !otherVarExists;
    });
  },
);
