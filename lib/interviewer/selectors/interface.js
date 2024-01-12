import { filter, includes, intersection } from 'lodash';
import { getProtocolCodebook } from './protocol';
import { getNetwork, getNetworkEdges, getNetworkNodes } from './network';
import {
  getPromptOtherVariable,
  getStageSubject,
  stagePromptIds,
  getPropPromptId,
  getPromptVariable,
  getSubjectType,
} from './prop';
import { createSelector } from '@reduxjs/toolkit';
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
    return nodeInfo && nodeInfo[nodeType] && nodeInfo[nodeType].variables;
  },
);

export const makeGetNodeVariables = () => getNodeVariables;

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

export const getNetworkEdgesForType = createSelector(
  getNetworkEdges,
  getStageSubject,
  (edges, subject) => filter(edges, ['type', subject.type]),
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
      return filter(network.nodes, ['type', subject.type]);
    }
    if (subject.entity === 'edge') {
      return filter(network.edges, ['type', subject.type]);
    }
    return [network.ego];
  },
);

export const makeNetworkEntitiesForType = () => getNetworkEntitiesForType;

/**
 * makeNetworkNodesForType()
 * Get the current prompt/stage subject, and filter the network by this node type.
 */

export const getNetworkNodesForType = createSelector(
  getNetworkNodes,
  getStageSubject,
  (nodes, subject) => filter(nodes, ['type', subject.type]),
);

export const makeNetworkNodesForType = () => getNetworkNodesForType;

// makeNetworkNodesForStage()
export const getStageNodeCount = createSelector(
  getNetworkNodesForType,
  stagePromptIds,
  (nodes, promptIds) =>
    filter(nodes, (node) => intersection(node.promptIDs, promptIds).length > 0)
      .length,
);

export const makeGetStageNodeCount = () => {
  return createSelector(
    getNetworkNodesForType,
    stagePromptIds,
    (nodes, promptIds) =>
      filter(
        nodes,
        (node) => intersection(node.promptIDs, promptIds).length > 0,
      ).length,
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
  (prompts, promptIndex) => prompts[promptIndex].id,
);

export const getNetworkNodesForPrompt = createSelector(
  getNetworkNodesForType,
  getPromptId,
  (nodes, promptId) => filter(nodes, (node) => includes(node.promptIDs, promptId)),
);

export const makeNetworkNodesForPrompt = () => getNetworkNodesForPrompt;

/**
 * makeNetworkNodesForOtherPrompts()
 *
 * Same as above, except returns a filtered node list that **excludes** nodes that match the current
 * prompt's promptId.
 */

export const getNetworkNodesForOtherPrompts = createSelector(
  getNetworkNodesForType, getPromptId,
  (nodes, promptId) => filter(nodes, (node) => !includes(node.promptIDs, promptId)),
);

export const makeNetworkNodesForOtherPrompts = () =>
  getNetworkNodesForOtherPrompts;
