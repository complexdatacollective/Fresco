import { createSelector } from '@reduxjs/toolkit';
import { getNetwork, getNetworkEdges, getNetworkNodes } from './network';
import {
  getPromptOtherVariable,
  getPromptVariable,
  getStageSubject,
  getSubjectType,
  stagePromptIds,
} from './prop';
import { getProtocolCodebook } from './protocol';
import { getPromptIndex, getPrompts } from './session';

// Selectors that are generic between interfaces

/*
These selectors assume the following props:
  stage: which contains the protocol config for the stage
  prompt: which contains the protocol config for the prompt
*/

export const getNodeVariables = createSelector(
  getProtocolCodebook,
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

/**
 * makeNetworkEdgesForType()
 * Get the current prompt/stage subject, and filter the network by this edge type.
 */

const getNetworkEdgesForType = createSelector(
  getNetworkEdges,
  getStageSubject,
  (edges, subject) => {
    if (!subject || !edges) {
      return [];
    }
    return edges.filter((edge) => edge.type === subject.type);
  },
);

export const makeNetworkEdgesForType = () => getNetworkEdgesForType;

/**
 * makeNetworkEntitiesForType()
 * Get the current prompt/stage subject, and filter the network by this entity type.
 */
export const getNetworkEntitiesForType = createSelector(
  getNetwork,
  getStageSubject,
  (network, subject) => {
    if (!subject || !network) {
      return [];
    }
    if (subject.entity === 'node') {
      return network.nodes.filter((node) => node.type === subject.type);
    }
    if (subject.entity === 'edge') {
      return network.edges.filter((edge) => edge.type === subject.type);
    }
    return [network.ego];
  },
);

/**
 * makeNetworkNodesForType()
 * Get the current prompt/stage subject, and filter the network by this node type.
 */

export const getNetworkNodesForType = createSelector(
  getNetworkNodes,
  getStageSubject,
  (nodes, subject) => {
    if (!subject || !nodes) {
      return [];
    }
    return nodes.filter((node) => node.type === subject.type);
  }
);

export const makeNetworkNodesForType = () => getNetworkNodesForType;

// Creates an array of unique values that are included in all of the provided arrays using SameValueZero for equality comparisons.
const intersection = (array, ...arrays) => {
  return array.filter((value) => arrays.every((arr) => arr.includes(value)));
};

// makeNetworkNodesForStage()
export const getStageNodeCount = createSelector(
  getNetworkNodesForType,
  stagePromptIds,
  (nodes, promptIds) => nodes.filter((node) => intersection(node.promptIDs, promptIds).length > 0).length
);

export const makeGetStageNodeCount = () => {
  return createSelector(
    getNetworkNodesForType,
    stagePromptIds,
    (nodes, promptIds) => nodes.filter((node) => intersection(node.promptIDs, promptIds).length > 0).length

  );
};

/**
 * makeNetworkNodesForPrompt
 *
 * Return a filtered node list containing only nodes where node IDs contains the current promptId.
 */
export const getPromptId = createSelector(
  getPrompts,
  getPromptIndex,
  (prompts, promptIndex) => {
    if (!prompts) {
      return null;
    }

    return prompts[promptIndex].id || 0;
  },
);

export const getNetworkNodesForPrompt = createSelector(
  getNetworkNodesForType,
  getPromptId,
  (nodes, promptId) => nodes.filter((node) => node.promptIDs.includes(promptId)),
);

/**
 * makeNetworkNodesForOtherPrompts()
 *
 * Same as above, except returns a filtered node list that **excludes** nodes that match the current
 * prompt's promptId.
 */

export const getNetworkNodesForOtherPrompts = createSelector(
  getNetworkNodesForType, getPromptId,
  (nodes, promptId) => nodes.filter((node) => !node.promptIDs.includes(promptId)),
);
